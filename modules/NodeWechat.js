/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-18 17:32:09
 */

const events = require('events');
const logger = require('../lib/logger');
const QR = require('qr-image');
const requestWechatApi = require('../lib/requestWechatApi');
const Message = require('./Message');
const Member = require('./Member');
const emitter = new events.EventEmitter();
const sleep = require('../lib/tools').sleep;
const robot = require('../lib/tuling');
const ASR = require('../lib/baiduASR');
class NodeWechat {
  /**
   * Creates an instance of NodeWechat.
   * @param {object} conf -config
   * @memberof NodeWechat
   */
  constructor(conf) {
    this.data = {
      autoDownloadMedia: true,
      autoTransformVoice:true,
      MsgList: [],
      MemberList: [],
    };
    this.Message = Message;
    this.Member = Member;
  }
  /**
   * login 
   * @fires NodeWechat#qr.get - get a QR code
   * @fires NodeWechat#waiting - waiting confirm login on mobile wechat
   * @fires NodeWechat#login - login successful
   * @throws login error
   * @memberof NodeWechat
   */
  async login() {
    let res = await requestWechatApi.login(arguments[0]);
    if (!res) throw new Error(`login error`);
    // get qrcode
    if (res.step === 'qr') {
      /**
       * @event NodeWechat#qr.get
       * @type {object}
       * @property {Buffer} QRcode - QRcode image binary
       * @property {string} url - QRcode's text
       */
      this.emit('qr.get', {
        QRcode: QR.imageSync(res.uri, {
          type: 'png'
        }),
        url: res.uri
      });
      await this.login(res);
    }
    // waiting confirm login
    if (res.step === 'waiting') {
      /**
       * @event NodeWechat#waiting
       */
      this.emit('qr.waiting');
      await sleep(1000);
      await this.login(res);
    }
    // login success
    if (res.step === 'success') {
      Object.assign(this.data, res);
      this.data.User = new this.Member(this.data.User);
      /**
       * @event NodeWechat#login
       * @type {Member}
       */
      this.emit('login', this.data.User);
    }
  }
  /**
   * get member and batch member
   * @memberof NodeWechat
   */
  async getContact() {
    /**
     * @event NodeWechat#contact.get.start
     */
    this.emit('contact.get.start');
    let memberList = await requestWechatApi.getContact(this.data);
    // clear old data
    this.data.MemberList = [];
    for (let i = 0; i < memberList.length; i++) {
      const member = memberList[i];
      this.data.MemberList.push(new this.Member(member));
    }
    /**
     * @event NodeWechat#contact.get.end
     */
    this.emit('contact.get.end', this.data.MemberList);
  }
  /**
   *  is there any new messages
   * @fires NodeWechat#error - error 
   * @fires NodeWechat#logout - logout
   * @memberof NodeWechat
   */
  async __checkMsg() {
    let res = await requestWechatApi.checkMsg(this.data).catch(error => {
      this.emit('error', error);
    });
    if (!res) res = {};
    if (res.retcode == 1101) return this.emit('logout');
    if (res.retcode == 1102) return;
    //
    if (+res.selector < 7) {
      await this.getMsg().catch(error => {
        this.emit('error', error);
      });
    }
    this.__checkMsg();
  }
  /**
   * get new messages
   * @fires NodeWechat#message
   * @fires NodeWechat#error
   * @returns {PromiseLike}
   * @memberof NodeWechat
   */
  async getMsg() {
    let res = await requestWechatApi.getMsg(this.data).catch(error => {
      this.emit('error', error);
    });
    // update SyncCheckKey and SyncKey
    this.data.SyncCheckKey = res.SyncCheckKey
    this.data.SyncKey = res.SyncKey;
    if (res.AddMsgList.length === 0) return;
    const msgs = [];
    for (let i = 0; i < res.AddMsgList.length; i++) {
      const data = res.AddMsgList[i];
      //wechat init msg,ignore
      if (data.MsgType === 51) return;
      let msg = new this.Message(data, this);
      // await msg parse
      await msg.parse();
      if (msg.ToUserName == 'filehelper') {
        let reply = await this.robot(msg.Content)
        this.sendMsg({
          Content: reply,
          ToUserName:'filehelper'
        });
      }
      this.data.MsgList.push(msg);
      msgs.push(msg);
    }
    /**
     * @event NodeWechat#message
     */
    this.emit('message', msgs);
  }
  /**
   * 
   * @param {Object} msg - message
   * @param {string} msg.Content - message content
   * @param {string | number} msg.ToUserName - message to
   * @returns {PromiseLike}
   * @memberof NodeWechat
   */
  async sendMsg(msg) {
    if (!msg.Content) return this.emit('error', {
      type: 'send',
      message: 'message content is empty'
    });
    if (!msg.ToUserName) return this.emit('error', {
      type: 'send',
      message: 'there is no reciver'
    });
    if (Number.isInteger(+msg.ToUserName)) {
      if (!this.data.MemberList[+msg.ToUserName]) return this.emit('error', {
        type: 'send',
        message: `can't find member at index:${msg.ToUserName}`
      });
      msg.ToUserName = this.data.MemberList[+msg.ToUserName].UserName;
    }
    msg.FromUserName = this.data.User.UserName;
    let res = await requestWechatApi.sendMsg(this.data, msg);
    this.emit('send', msg);
  }
  /**
   * get message's media
   * @param {Message} msg - msg
   * @param {string} type - msg type
   * image || video || file
   * @memberof NodeWechat
   */
  async getMsgMedia(msg, type) {
    let filePath = await requestWechatApi.getMsgMedia(this.data, msg, type);
    msg.FilePath = filePath;
    if (this.data.autoTransformVoice && type === Message.mediaType.voice.name) {
      let voiceText = await ASR.recognize(msg.FilePath);
      if (voiceText.result) {
        msg.VoiceToText = voiceText.result.join('');
        this.sendMsg({
          Content: voiceText.result.join(''),
          ToUserName: 'filehelper'
        });
      }
    }
    this.emit('message.media', {
      msg
    });
  }
  /**
   * logout
   * @memberof NodeWechat
   */
  async logout() {
    let flag = await logout(this.data).catch(err => {

    });
    if (flag) return this.emit('logout')
  }
  /**
   * init a NodeWechat instance
   * @fires NodeWechat#init
   * @memberof NodeWechat
   */
  async init() {
    try {
      await this.login();
      await this.getContact();
      /**
       * @event NodeWechat#init
       */
      this.emit('init', this.data);
      await this.getMsg();
      this.__checkMsg();
    } catch (error) {
      this.emit('error', error)
    }
  }
  /**
   * 
   * search member in MemberList 
   * @param {object} param - search param
   * @param {string} param.kw - keyword
   * @returns {Array<Member>}
   * @memberof NodeWechat
   */
  searchInMemberList(param) {
    let members = [];
    let list = this.data.MemberList;
    for (let i = 0; i < list.length; i++) {
      const member = list[i];
      if (member.RemarkName.indexOf(param.kw) !== -1 || member.NickName.indexOf(param.kw) !== -1) {
        members.push(member);
      }
    }
    return members;
  }
  /**
   * get a memeber by UserName
   * @param {string} UserName 
   * @returns {Member}
   * @memberof NodeWechat
   */
  getMemberByUserName(UserName) {
    let list = this.data.MemberList;
    for (let i = 0; i < list.length; i++) {
      const member = list[i];
      if (member.UserName === UserName) {
        return member;
      }
    }
    // if not found,find in group
    for (let i = 0; i < list.length; i++) {
      const member = list[i];
      if (member.UserName.indexOf('@@') === -1) continue;
      for (let j = 0; j < member.MemberList.length; j++) {
        const memberInGroup = member.MemberList[j];
        if (memberInGroup.UserName === UserName) {
          memberInGroup.Group = member;
          return new this.Member(memberInGroup);
        }
      }
    }
    // if still not found,try get batch contact
    //TODO:
  }
  /**
   * 
   * get message by MsgId from locale message list
   * @param {string} MsgId 
   * @returns {Msg}
   * @memberof NodeWechat
   */
  getMsgByMsgId(MsgId) {
    for (let i = 0; i < this.data.MsgList.length; i++) {
      const msg = this.data.MsgList[i];
      if (msg.MsgId === MsgId) return msg;
    }
  }
  /**
   * send revoked message to anyone,default is filehelper
   * @param {Msg} msg - revoked msg
   * @param {string} ToUserName - sent to whom
   */
  sendRevokedMsgToOther(msg, ToUserName = 'filehelper') {
    let Content =
      `抓到一个撤回消息的，${msg.FromUser.getFullName()}撤回了一条消息，消息内容：${msg.Content.toString()}`;
    this.sendMsg({
      Content,
      ToUserName
    });
  }

  async robot(text) {
    let reply = await robot(text).then(res => {
      switch (+res.code) {
        case 100000:
          return res.text;
          break;
        case 200000:
          return `${res.text}\n${res.url}`
          break;
        case 302000:
          let content = '找到以下新闻：\n';
          res.list.forEach((news, index) => {
            content += `\n【${index + 1}】：${news.article}`;
            content += `\n链接：${news.detailurl}`;
            content += `\n来源：${news.source}`;
          });
          return content;
        default:
          break;
      }
    });
    return reply;
  }

  /**
   * add eventlistener
   * @param {string} evt -event name
   * @param {function} cb - callback
   * @returns {NodeWechat}
   * @memberof NodeWechat
   */
  on(evt, cb) {
    emitter.on(evt, cb)
    return this;
  }
  /**
   * emit a event
   * @param {string} evt - event name
   * @param {Object} data 
   * @returns {NodeWechat}
   * @memberof NodeWechat
   */
  emit(evt, data) {
    emitter.emit(evt, data);
    return this;
  }
}
module.exports = NodeWechat

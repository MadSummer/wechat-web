/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-03 23:23:50
 */
const emitter = require('./lib/emitter');
const logger = require('./lib/logger');
const QR = require('./lib/qr');
const sleep = require('./lib/sleep');
const xml2json = require('./lib/decodeXML2JSON');
const getUUID = require('./wechatapi/getUUID');
const getQR = require('./wechatapi/getQR');
const scanQR = require('./wechatapi/scanQR');
const getRedictURL = require('./wechatapi/getRedictURL');
const initWebWX = require('./wechatapi/initWebWX');
const getContact = require('./wechatapi/getContact');
const checkMsg = require('./wechatapi/checkMsg');
const getMsg = require('./wechatapi/getMsg');
const sendMsg = require('./wechatapi/sendMsg');
const getMsgMedia = require('./wechatapi/getMsgMedia');
const logout = require('./wechatapi/logout');


class NodeWechat {
  /**
   * Creates an instance of NodeWechat.
   * @memberof NodeWechat
   */
  constructor() {
    this.data = {
      MsgList: [],
      MemberList: []
    };
    this.Msg = Msg;
    this.Member = Member;
  }
  async getUUID() {
    this.data.uuid = await getUUID();
    if (!this.data.uuid) throw new Error('get uuid error');
  }
  showQR() {
    let qr = QR(getQR(this.data.uuid).uri);
    this.emit('qr.get', {
      qr: qr,
      url: getQR(this.data.uuid).uri
    });
  }
  async scanQR() {
    let res = await scanQR(this.data.uuid, 1);
    if (!res) res = {}
    if (res.code == 201) {
      this.emit('qr.waiting', res);
      await sleep(1000);
      await this.scanQR();
    }
    if (res.code == 200) {
      this.data.redirect_uri = res.redirect_uri;
    }
    if (res.code == 408) throw new Error('qrcode scan result error');
  }
  async getRedictURL() {
    let info = await getRedictURL(this.data.redirect_uri);
    if (!info) throw new Error(`request ${this.data.redirect_uri} error`);
    Object.assign(this.data, info);
  }
  async initWebWX() {
    let initData = await initWebWX(this.data);
    if (!initData) throw new Error(`get user info error`);
    Object.assign(this.data, initData);
    this.emit('info', initData.User);
  }
  /**
   * get member and group
   * 
   * @memberof NodeWechat
   */
  async getContact() {
    this.emit('contact.get.start');
    let memberList = await getContact(this.data);
    // clear old data
    this.data.MemberList = [];
    for (let i = 0; i < memberList.length; i++) {
      const member = memberList[i];
      this.data.MemberList.push(new this.Member(member));
    }
    this.emit('contact.get.end', this.data.MemberList);
  }
  async __checkMsg() {
    let res = await checkMsg(this.data).catch(error => {
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
  async getMsg() {
    let res = await getMsg(this.data).catch(error => {
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
      let msg = new this.Msg(data, this);
      this.data.MsgList.push(msg);
      msgs.push(msg);
    }
    this.emit('message', msgs);
  }
  /**
   * 
   * @param {Object} msg - message
   * @param {string} msg.Content - message content
   * @param {string | number} msg.ToUser - message to
   * @returns {PromiseLike}
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
    let res = await sendMsg(this.data, msg);
    this.emit('send', msg);
  }
  /**
   * 
   * 
   * @param {Msg} msg - msg
   * @param {string} type - msg type
   * image || video || file
   * @memberof NodeWechat
   */
  async getMsgMedia(msg, type) {
    switch (type) {
      case 'image':

        break;
      case 'video':

        break;
      case 'file':

        break;
      default:
        break;
    }
  }
  async logout() {
    let flag = await logout(this.data).catch(err => {

    });
    if (flag) return this.emit('logout')
  }
  async init() {
    try {
      await this.getUUID();
      this.showQR();
      await this.scanQR()
      await this.getRedictURL();
      await this.initWebWX();
      await this.getContact();
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
   * 
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
  on(evt, cb) {
    emitter.on(evt, cb)
    return this;
  }
  emit(evt, data) {
    emitter.emit(evt, data);
    return this;
  }
}
class Member {
  constructor(obj) {
    this.__init(obj);
  }
  __init(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        this[key] = element;
      }
    }
  }
  getFullName() {
    return this.RemarkName || this.DisplayName || this.NickName;
  }
  isGroup() {
    return this.UserName.indexOf('@@') !== -1;
  }

}

class Msg {
  /**
   * Creates an instance of Msg.
   * @param {object} obj 
   * @param {NodeWechat} wechat 
   * @memberof Msg
   */
  constructor(obj, wechat) {
    this.wechat = wechat;
    this.__init(obj);
    this.parse();
  }

  __init(obj, wechat) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        this[key] = element;
      }
    }
  }
  parse() {
    `MsgType    说明
      1         文本消息
      3         图片消息
      34        语音消息
      37        好友确认消息
      40        POSSIBLEFRIEND_MSG
      42        共享名片
      43        视频消息
      47        动画表情
      48        位置消息
      49        分享链接
      50        VOIPMSG
      51        微信初始化消息
      52        VOIPNOTIFY
      53        VOIPINVITE
      62        小视频
      9999      SYSNOTICE
      10000     系统消息
      10002     撤回消息`
    this.FromUser = this.wechat.getMemberByUserName(this.FromUserName) ||
      new this.wechat.Member({
        NickName: '<empty>'
      });
    this.ToUser = this.wechat.getMemberByUserName(this.ToUserName) ||
      new this.wechat.Member({
        NickName: '<empty>'
      });
    if (this.isGroupMsg()) {
      // If the sender of the message is self,there is no `:<br/>` in msg.Content
      if (this.Content.indexOf(':<br/>') !== -1 && this.Content.startsWith('@')) {
        this.FromGroup = this.FromUser;
        this.Content = this.Content.split(':<br/>')[1];
        this.FromUser = this.wechat.getMemberByUserName(this.Content.split(':<br/>')[0]);
      } else {
        // the sender of the message is self
        this.FromGroup = this.ToUser;
      }
    }
    let json;
    switch (this.MsgType) {
      case 1:
        // text
        break;
      case 3:
        //image
        
        break;
      case 49:
        json = xml2json(this.Content);
        let msg;
        if (json) {
          msg = json.msg;
          this.Content = {
            appname: msg.appinfo.appname,
            desc: msg.appmsg.des,
            title: msg.appmsg.title,
            url: msg.appmsg.url
          }
        }
        break;
      case 10002:
        // revoked
        json = xml2json(this.Content);
        if (json) {
          let revokedMsgId = json.sysmsg.revokemsg.msgid;
          this.RevokedMsg = this.wechat.getMsgByMsgId(revokedMsgId);
        }
        this.wechat.sendRevokedMsgToOther(msg.RevokedMsg);
        break;
      default:
        break;
    }
  }
  isGroupMsg() {
    return this.FromUserName.startsWith('@@') || this.ToUserName.startsWith('@@')
  }
}
/**
 * @module NodeWechat
 */
module.exports = new NodeWechat()
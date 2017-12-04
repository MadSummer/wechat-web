/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-04 18:19:42
 */
const emitter = require('../lib/emitter');
const logger = require('../lib/logger');
const QR = require('../lib/qr');
const sleep = require('../lib/sleep');
const requestWechatApi = require('../lib/requestWechatApi');
const Message = require('./Message');
const Member = require('./Member');
class NodeWechat {
  /**
   * Creates an instance of NodeWechat.
   * @param {object} conf -config
   * @memberof NodeWechat
   */
  constructor(conf) {
    this.data = {
      MsgList: [],
      MemberList: []
    };
    this.Message = Message;
    this.Member = Member;
  }
  async getQRcode() {
    let res = await requestWechatApi.getQRcode();
    this.data.uuid = res.uuid;
    let qr = QR(res.uri);
    this.emit('qr.get', {
      qr: qr,
      url: res.uri
    });
  }
  async QRcodeScanResult() {
    let res = await requestWechatApi.QRcodeScanResult(this.data.uuid, 1);
    if (!res) res = {}
    if (res.code == 201) {
      this.emit('qr.waiting', res);
      await sleep(1000);
      await this.QRcodeScanResult();
    }
    if (res.code == 200) {
      this.data.redirect_uri = res.redirect_uri;
    }
    if (res.code == 408) throw new Error('qrcode scan result error');
  }
  async login() {
    let info = await requestWechatApi.login(this.data.redirect_uri);
    if (!info) throw new Error(`login error`);
    Object.assign(this.data, info);
    this.emit('login', info.User);
  }
  /**
   * get member and batch member
   * 
   * @memberof NodeWechat
   */
  async getContact() {
    this.emit('contact.get.start');
    let memberList = await requestWechatApi.getContact(this.data);
    // clear old data
    this.data.MemberList = [];
    for (let i = 0; i < memberList.length; i++) {
      const member = memberList[i];
      this.data.MemberList.push(new this.Member(member));
    }
    this.emit('contact.get.end', this.data.MemberList);
  }
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
    let res = await requestWechatApi.sendMsg(this.data, msg);
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
      await this.getQRcode();
      await this.QRcodeScanResult();
      await this.login();
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
module.exports = new NodeWechat()
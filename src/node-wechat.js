/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-11-29 22:46:57
 */
const errorEx = require('error-ex');
const co = require('co');
const ora = require('ora');
const emitter = require('./lib/emitter');
const {
  logger
} = require('./lib/logger');
const QR = require('./lib/qr');
const sleep = require('./lib/sleep');
const parseWechatMsg = require('./lib/parseWechatMsg');

const getUUID = require('./wechatapi/getUUID');
const getQR = require('./wechatapi/getQR');
const scanQR = require('./wechatapi/scanQR');
const getRedictURL = require('./wechatapi/getRedictURL');
const initWebWX = require('./wechatapi/initWebWX');
const getContact = require('./wechatapi/getContact');
const checkMsg = require('./wechatapi/checkMsg');
const getMsg = require('./wechatapi/getMsg');
const sendMsg = require('./wechatapi/sendMsg');
const logout = require('./wechatapi/logout');


class NodeWechat {
  constructor() {
    this.data = {
      autoGetMsg: true,
      showTips: true
    }
  }
  async getUUID() {
    this.data.uuid = await getUUID();
    if (!this.data.uuid) throw new Error('没有获取到UUID');
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
    if (res.code == 408) throw new Error('扫码结果失败');
  }
  async getRedictURL() {
    let info = await getRedictURL(this.data.redirect_uri);
    if (!info) throw new Error(`请求${this.data.redirect_uri}失败`);
    Object.assign(this.data, info);
  }
  async initWebWX() {
    let initData = await initWebWX(this.data);
    if (!initData) throw new Error(`拉取信息失败`);
    Object.assign(this.data, initData);
    this.emit('info', initData.User);
  }
  async getContact() {
    this.emit('contact.get.start');
    let memberList = await getContact(this.data);
    this.data.MemberList = memberList;
    this.emit('contact.get.end', memberList);
  }
  async checkMsg() {
    let res = await checkMsg(this.data).catch(error => {
      this.emit('error', error);
    });
    if (!res) res = {};
    if (res.retcode == 1101) return;
    if (res.retcode == 1102) return;
    if (res.selector == 2) {
      await this.getMsg().catch(error => {
        this.emit('error', error);
      });
    }
    this.checkMsg();
  }
  async getMsg() {
    let res = await getMsg(this.data).catch(error => {
      this.emit('error', error);
    });
    this.data.SyncCheckKey = res.SyncCheckKey
    this.data.SyncKey = res.SyncKey;
    if (res.AddMsgList.length > 0) {
      const msgs = [];
      res.AddMsgList.forEach(msg => {
        let fromUser = this.getMemberByUserName(msg.FromUserName);
        let toUser = this.getMemberByUserName(msg.ToUserName);
        if (!fromUser) fromUser = {
          NickName: '<空>'
        }
        if (!toUser) toUser = {
          NickName: '<空>'
        }
        if (!msg.Content) {

        } else {
          msg.FromUser = fromUser;
          msg.ToUser = toUser;
          msgs.push(msg);
        }
        this.emit('message', msgs);
      });
    }
  }
  /**
   * 
   * @param {Object} msg - 消息对象
   * @param {string} msg.content - 消息内容
   * @param {string | number} msg.to - 消息接收者
   * @returns {PromiseLike}
   */
  async sendMsg(msg) {
    if (!msg.content) return this.emit('error', {
      type: 'send',
      message: '不能发送空消息'
    });
    if (!msg.to) return this.emit('error', {
      type: 'send',
      message: '没有指定接收者'
    });
    if (Number.isInteger(+msg.to)) {
      if (!this.data.MemberList[+msg.to]) return this.emit('error', {
        type: 'send',
        message: `未查找到第${+msg.to}位联系人`
      });
      msg.to = this.data.MemberList[+msg.to].UserName;
    }
    msg.from = this.data.User.UserName;
    let res = await sendMsg(this.data, msg);
    this.emit('send', msg);
  }
  async logout() {
    let flag = await logout(this.data);
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
      this.checkMsg();
    } catch (error) {
      this.emit('error', error)
    }
  }
  showContact(param) {
    let members = `\r\n`;
    for (let i = param.start || 0; i < (param.end || this.data.MemberList.length); i++) {
      const member = this.data.MemberList[i];
      if (!member) break;
      members += `[${i}]${member.RemarkName}(${member.NickName})\r\n`;
    }
    logger.debug(members);
  }
  search(param) {
    let MemberList = this.data.MemberList;
    let members = [];
    for (let i = 0; i < MemberList.length; i++) {
      const member = MemberList[i];
      if (member.RemarkName.indexOf(param.query) !== -1) {
        members.push(member.RemarkName);
        continue;
      }
      if (member.NickName.indexOf(param.query) !== -1) {
        members.push(member.NickName)
      }
    }
    return members;
  }
  help() {
    interactive.showHelp();
  }
  setting(param) {
    if ('saveChatRecord' in param) {
      log4js.saveChatRecord(!!param.saveChatRecord);
    }
  }
  getMemberByUserName(Username) {
    if (!this.data.MemberList) return logger.warn(`没有获取到联系人`);
    for (let i = 0; i < this.data.MemberList.length; i++) {
      const member = this.data.MemberList[i];
      if (member.UserName === Username) {
        return member;
      }
    }
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
const addEventListener = () => {
  for (const operation in action) {
    if (action.hasOwnProperty(operation)) {
      const handler = action[operation];
      emitter.on(operation, handler);
    }
  }
}
module.exports = new NodeWechat()
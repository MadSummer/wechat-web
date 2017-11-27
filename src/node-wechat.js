/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-11-27 17:15:26
 */
const co = require('co');
const ora = require('ora');
const { parseStdin, showHelp } = require('./lib/interactive');
const emitter = require('./lib/emitter');
const { logger, chatLogger } = require('./lib/logger');
const showQR = require('./lib/showQR');

const getUUID = require('./wechatapi/getUUID');
const getQR = require('./wechatapi/getQR');
const login = require('./wechatapi/login');
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
    this.data.uuid = await getUUID;
    if (!this.data.uuid) { 
      this.emit('error', {
        message: ' 获取UUID失败'
      });
    };
  }
  showQR() {
    showQR(getQR(this.data.uuid));
  }
  async login() {
    this.data.redirect_uri = (await login(this.data.uuid, 1)).redirect_uri;
  }
  async getRedictURL() {
    let info = await getRedictURL(this.redirect_uri);
    if (!info) {
      return this.emit('error', {
        message:'登录失败'
      });
    }
    Object.assign(this.data, info);
    this.emit('login');
  }
  async initWebWX() {
    let initData = await initWebWX(this.data);
    if (!initData) {
      this.emit('error', {
        message:'获取个人信息失败'
      });
    };
    Object.assign(this.data, initData);
    this.emit('init', initData.User);
  }
  async getContact() {
    this.emit('get.contact.start');
    let obj = await getContact(this.data);
    this.emit('get.contact.end');
    this.data.MemberList = obj.MemberList;
  }
  async checkMsg() {
    let res = await checkMsg(data);
    if (!res) res = {};
    if (res.retcode == 1101) return logger.warn(`账号已退出`);
    if (res.selector == 2) {
      await this.getMsg();
    }
    if (data.autoGetMsg) {
      this.checkMsg();
    }
  }
  async getMsg() {
    let res = await getMsg(data);
    this.data.SyncCheckKey = res.SyncCheckKey
    this.data.SyncKey = res.SyncKey;
    if (res.AddMsgList.length > 0) {
      const msgs = [];
      res.AddMsgList.forEach(msg => {
        let fromUser = tools.getMemberByUserName(msg.FromUserName);
        let toUser = tools.getMemberByUserName(msg.ToUserName);
        if (!fromUser) fromUser = { NickName: '<空>' }
        if (!toUser) toUser = { NickName: '<空>' }
        if (!msg.Content) {

        } else {
          msg.FromUser = fromUser;
          msg.ToUser = toUser;
          msgs.push(msg);
        }
        this.emit('getMsg', msgs);
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
    if (!msg.content) logger.warn('不能发送空的消息');
    if (!msg.to) logger.warn('没有接收者');
    if (Number.isInteger(+msg.to)) {
      if (!data.MemberList[+msg.to]) return logger.warn(`未查找到第${+msg.to}位联系人`);
      msg.to = data.MemberList[+msg.to].UserName;
    }
    msg.from = data.User.UserName;
    let res = await sendMsg(data, msg);
    this.emit('sendMsgSuccessful', msg);
  }
  async logout() {
    let flag = await logout(data);
    if (flag) {
      this.emit('logout')
      logger.debug('已退出当前账号')
      return;
    };
  }
  async init() {
    await this.getUUID();
    this.showQR();
    await this.login();
    await this.getRedictURL();
    await this.initWebWX();
    await this.getContact();
    await this.getMsg();
    this.checkMsg();
    this.emit('init');
  }
  showContact(param) {
    let members = `\r\n`;
    for (let i = param.start || 0; i < (param.end || data.MemberList.length); i++) {
      const member = data.MemberList[i];
      if (!member) break;
      members += `[${i}]${member.RemarkName}(${member.NickName})\r\n`;
    }
    logger.debug(members);
  }
  search(param) {
    let MemberList = data.MemberList;
    let members = `\r\n`;
    for (let i = 0; i < MemberList.length; i++) {
      const member = MemberList[i];
      if (member.NickName.indexOf(param.query) !== -1 ||
        member.RemarkName.indexOf(param.query) !== -1) {
        members += `[${i}]${member.RemarkName}(${member.NickName})\r\n`;
      }
    }
    logger.debug(members);
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
    for (let i = 0; i < data.MemberList.length; i++) {
      const member = data.MemberList[i];
      if (member.UserName === UserName) {
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
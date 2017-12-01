/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-01 14:59:35
 */
const emitter = require('./lib/emitter');
const logger = require('./lib/logger');
const QR = require('./lib/qr');
const sleep = require('./lib/sleep');
const parseWechatMsg = require('./lib/parseWechatMsg');

const getUUID = require('./wechatapi/getUUID');
const getQR = require('./wechatapi/getQR');
const scanQR = require('./wechatapi/scanQR');
const getRedictURL = require('./wechatapi/getRedictURL');
const initWebWX = require('./wechatapi/initWebWX');
const getContact = require('./wechatapi/getContact');
const getGroup = require('./wechatapi/getGroup');
const checkMsg = require('./wechatapi/checkMsg');
const getMsg = require('./wechatapi/getMsg');
const sendMsg = require('./wechatapi/sendMsg');
const logout = require('./wechatapi/logout');


class NodeWechat {
  constructor() {
    this.data = {}
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
    await this.getGroupMemberList();
    this.emit('contact.get.end', memberList);
  }
  async getGroupMemberList() {
    let groupList = [];
    function addToGroup(newGroup) {
      for (let i = 0; i < groupList.length; i++) {
        const group = groupList[i];
        if (group.UserName == newGroup.UserName) return;
      }
      groupList.push(newGroup);
    }
    // 获取保存到通讯录的群组
    for (let i = 0; i < this.data.MemberList.length; i++) {
      const member = this.data.MemberList[i];
      if (member.UserName && member.UserName.indexOf('@@') != -1) {
        addToGroup.call(this, {
          EncryChatRoomId: '',
          UserName: member.UserName
        });
      }
    }
    // 获取最近联系的群组，包含未保存到通讯录的
    for (let i = 0; i < this.data.ContactList.length; i++) {
      const member = this.data.ContactList[i];
      if (member.UserName && member.UserName.indexOf('@@') != -1) {
        addToGroup.call(this, {
          EncryChatRoomId: '',
          UserName: member.UserName
        });
      }
    }
    this.data.GroupMemberList = await getGroup(this.data, groupList);
  }
  async checkMsg() {
    let res = await checkMsg(this.data).catch(error => {
      this.emit('error', error);
    });
    if (!res) res = {};
    if (res.retcode == 1101) return this.emit('logout');
    if (res.retcode == 1102) return;
    //修改备注可能出发selector=6
    if (+res.selector < 7) {
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
        msg = parseWechatMsg(msg);
        msg.FromUser = this.getMemberByUserName(msg.FromUserName) || {
          NickName: '<空>'
        };
        msg.ToUser = this.getMemberByUserName(msg.ToUserName) || {
          NickName: '<空>'
        };
        if (msg.isGroupMsg) {
          msg.GroupMsgSenderUser = this.getMemberByUserName(msg.groupMsgSenderUserName);
        }
        msgs.push(msg);
      });
      this.emit('message', msgs);
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
  searchContact(param) {
    let members = [];
    let MemberList = this.data.MemberList;
    let GroupMemberList = this.data.GroupMemberList;
    function find(list, query) {
      for (let i = 0; i < list.length; i++) {
        const member = list[i];
        if (member.RemarkName.indexOf(query) !== -1 || member.NickName.indexOf(query) !== -1) {
          members.push(member);
          continue;
        }
      }
    }
    find(MemberList, param.kw);
    find(GroupMemberList, param.kw);
    return members;
  }
  getMemberByUserName(UserName) {
    let list;
    UserName.indexOf('@@') != -1 ?
      list = this.data.GroupMemberList : list = this.data.MemberList;
    for (let i = 0; i < list.length; i++) {
      const member = list[i];
      if (member.UserName === UserName) {
        return member;
      }
      if (member.MemberList && UserName.indexOf('@@') == -1) {
        for (let j = 0; j < member.MemberList.length; j++) {
          const memberInGroup = member.MemberList[j];
          if (memberInGroup.UserName === UserName) {
            return memberInGroup;
          }
        }
      }
    }
  }
  getFullName(member) {
    return `${member.NickName}${member.RemarkName ? '(' + member.RemarkName + ')' : ''}`
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
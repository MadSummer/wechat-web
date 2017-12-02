/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-02 17:51:10
 */
const emitter = require('./lib/emitter');
const logger = require('./lib/logger');
const QR = require('./lib/qr');
const sleep = require('./lib/sleep');
const xml2js = require('xml2js');
const entities = require('entities');

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
      msgList: {},
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
    if (res.AddMsgList.length > 0) {
      const msgs = [];
      res.AddMsgList.forEach(msg => {
        msg = parseWechatMsg(msg);
        this.data.MsgList[msg.MsgId] = msg;
        if (msg.MsgType == 10002) {
          this.sendRevokedMsgToOther(this.data.MsgList[msg.RevokeMsgId]);
        }
        msg.FromUser = this.getMemberByUserName(msg.FromUserName) || {
          NickName: '<empty>'
        };
        msg.ToUser = this.getMemberByUserName(msg.ToUserName) || {
          NickName: '<empty>'
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
   * @param {Object} msg - message
   * @param {string} msg.content - message content
   * @param {string | number} msg.to - reciver
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
      this.__checkMsg();
    } catch (error) {
      this.emit('error', error)
    }
  }
  searchInContactList(param) {
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
        return new this.Member(member);
      }
      if (member.MemberList && UserName.indexOf('@@') == -1) {
        for (let j = 0; j < member.MemberList.length; j++) {
          const memberInGroup = member.MemberList[j];
          if (memberInGroup.UserName === UserName) {
            return new Member(memberInGroup);
          }
        }
      }
    }
  }
  /**
   * 
   * @param {object} msg - revoked msg
   */
  sendRevokedMsgToOther(msg, ToUserName = 'filehelper') {
    let content =
      `抓到一个撤回消息的，${this.getMemberByUserName(msg.FromUserName).FullName}撤回了一条消息，消息内容：${msg.Content}`;
    this.sendMsg({
      content: content,
      to: ToUserName
    });
    /* this.sendMsg({
      content: `别撤回啊，我都看见了--${msg.Content}`,
      to: msg.FromUserName
    }); */
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
    return `${this.NickName}${this.RemarkName ? '(' + this.RemarkName + ')' : ''}`
  }
  isGroup() {
    return this.UserName.indexOf('@@') !== -1;
  }

}

class Msg {
  constructor(obj) {

  }
  __init(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        this[key] = element;
      }
    }
    this.parse();
  }
  parse() {
    `MsgType   说明
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
    if (this.isGroupMsg()) {
      // If the sender of the message is self,there is no `:<br/>`
      if (this.Content.indexOf(':<br/>') !== -1) {
        this.Content = this.Content.split(':<br/>')[1];
        this.RealFromUserName = this.Content.split(':<br/>')[0];
      } else {
        //TODO:
      }
    }
    module.exports = msg => {
      msg.IsGroupMsg = isGroupMsg(msg);
      if (msg.IsGroupMsg) {
        let parse = getGroupMsgSenderUserName(msg);
        msg.GroupMsgSenderUserName = parse.groupMsgSenderUserName;
        msg.Content = parse.content;
      }
      switch (msg.MsgType) {
        case 1:
          // 文本消息
          break;
        case 3:
          //图片消息
          break;
        case 10002:
          // 撤回消息
          let revokeMsgId;
          xml2js.parseString(entities.decodeXML(msg.Content), (err, res) => {
            if (err) return;
            msg.RevokeMsgId = res.sysmsg.revokemsg[0].msgid[0];
          });
          break;
        default:
          break;
      }
      return msg;
    }
  }
  isGroupMsg() {
    return this.FromUserName.startsWith('@@') || this.ToUserName.startsWith('@@')
  }
}
module.exports = new NodeWechat()
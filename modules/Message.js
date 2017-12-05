/*
 * @Author: Liu Jing 
 * @Date: 2017-12-03 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-05 11:20:22
 */
const xml2json = require('../lib/decodeXML2JSON');
// just for vscode intelligent
const NodeWechat = require('./NodeWechat');
class Message {
  /**
   * Creates an instance of Msg.
   * @param {object} obj - wechat message
   * @param {NodeWechat} wechat - instance of NodeWechat
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
        const [Content, FromUserName] = this.Content.split(':<br/>')
        this.FromGroup = this.FromUser;
        this.Content = Content;
        this.FromUser = this.wechat.getMemberByUserName(FromUserName);
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
        json = xml2json(this.Content);
        if (json) {
          
        }
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
        this.wechat.sendRevokedMsgToOther(this.RevokedMsg);
        break;
      default:
        break;
    }
  }
  isGroupMsg() {
    return this.FromUserName.startsWith('@@') || this.ToUserName.startsWith('@@')
  }
}
module.exports = Message;
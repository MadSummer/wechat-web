/*
 * @Author: Liu Jing 
 * @Date: 2017-12-03 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-12 20:49:14
 */
const xml2json = require('../lib/decodeXML2JSON');
const fse = require('fs-extra');
const requestWechatApi = require('../lib/requestWechatApi');
const util = require('util');
const mediaType = {
  image: {
    name: 'image',
    suffix:'jpg'
  },
  video: {
    name: 'video',
    suffix:'flv'
  },
  file: {
    name: 'file',
    suffix:''
  },
  voice: {
    name: 'voice',
    suffix:'mp3'
  }
}
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
  }

  __init(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        this[key] = element;
      }
    }
    this.parsed = false; // is this has parsed
    this.__Content = this.Content; // save real content 
  }
  async parse() {
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
       5        链接
       6        文件消息
       3        音乐
      50        VOIPMSG
      51        微信初始化消息
      52        VOIPNOTIFY
      53        VOIPINVITE
      62        小视频
      9999      SYSNOTICE
      10000     系统消息
      10002     撤回消息`
    if (this.parsed) return;
    this.parsed = true;
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
        const [FromUserName, Content] = this.Content.split(':<br/>')
        this.Content = Content;
        this.FromUser = this.wechat.getMemberByUserName(FromUserName) ||
          new this.wechat.Member({
            NickName: '<empty>'
          });
        this.FromGroup = this.wechat.getMemberByUserName(this.FromUserName);
      } else {
        // the sender of the message is self
        this.FromGroup = this.ToUser;
      }
    }
    let json = xml2json(this.__Content);
    switch (this.MsgType) {
      case 1:
        // text
        if (this.SubMsgType == 48) {
          //location
          let location = xml2json(this.OriContent).msg.location.$;
          this.Content = `地理位置：${location.poiname}(${location.label})`
        }
        break;
      case 3:
        //image
        if (this.wechat.data.autoDownloadMedia) {
          this.wechat.getMsgMedia(this, mediaType.image.name);
        }
        break;
      case 42:
        //cards
        let username = json.msg.$.username
        this.Content = this.RecommendInfo;
        this.Content.WechatNum = username.indexOf('wxid_') == -1 ? username : json.msg.$.alias;
        break;
      case 43:
        //video
        if (this.wechat.data.autoDownloadMedia) {
          this.wechat.getMsgMedia(this, mediaType.video.name);
        }
        break;
      case 49:
        this.parseShareContent(json);
        break;
      case 10002:
        // revoked
        let revokedMsgId = json.sysmsg.revokemsg.msgid;
        this.RevokedMsg = this.wechat.getMsgByMsgId(revokedMsgId);
        this.wechat.sendRevokedMsgToOther(this.RevokedMsg);
        break;
      default:
        break;
    }
  }
  isGroupMsg() {
    return this.FromUserName.startsWith('@@') || this.ToUserName.startsWith('@@')
  }
  parseShareContent(shareContent) {
    if (!shareContent) return;
    let msg;
    msg = shareContent.msg;
    this.shareType = +msg.appmsg.type;
    // common properties
    this.Content = {
      appname: msg.appinfo.appname,
      desc: msg.appmsg.des,
      title: msg.appmsg.title,
      url: msg.appmsg.url
    }
    switch (this.shareType) {
      case 3:
        // music
        break;
      case 5:
        // url
        break;
      case 6:
        // file
        this.Content.size = +this.FileSize;
        if (this.wechat.data.autoDownloadMedia) {
          this.wechat.getMsgMedia(this, mediaType.file.name);
        }
        break;
      default:
        break;
    }
  }
}
Message.mediaType = mediaType;
module.exports = Message;
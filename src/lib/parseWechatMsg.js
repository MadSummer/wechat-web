const xml2js = require('xml2js');
const entities = require('entities');
const logger = require('./logger');
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
const isGroupMsg = msg => {
  return msg.FromUserName.startsWith('@@') || msg.ToUserName.startsWith('@@')
}
const getGroupMsgSenderUserName = msg => {
  let content;
  let groupMsgSenderUserName;
  if (msg.Content.indexOf(':<br/>') !== -1) {
    content = msg.Content.split(':<br/>')[1];
    groupMsgSenderUserName = msg.Content.split(':<br/>')[0];
  } else {
    content = msg.Content;
    groupMsgSenderUserName = msg.FromUserName
  }
  return {
    content,
    groupMsgSenderUserName
  }
}
module.exports = msg => {
  msg.isGroupMsg = isGroupMsg(msg);
  if (msg.isGroupMsg) {
    let parse = getGroupMsgSenderUserName(msg);
    msg.groupMsgSenderUserName = parse.groupMsgSenderUserName;
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
        msg.revokeMsgId = res.sysmsg.revokemsg[0].msgid[0];
      });
      break;
    default:
      break;
  }
  return msg;
}
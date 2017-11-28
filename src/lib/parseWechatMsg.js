const xml2js = require('xml2js');
const entities = require('entities');
const logger = require('./logger');
module.exports = msg => {
  switch (msg.MsgType) {
    case 1:
      // 文本消息
      break;
    case 3:
      //图片消息
      break;
    default:
      break;
  }
}
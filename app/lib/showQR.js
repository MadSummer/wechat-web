const logger = require('./logger').logger;
const qr = require('qrcode-terminal');
module.exports = content => {
  logger.debug(`扫描二维码登录`);
  qr.generate(content, { small: true })
}
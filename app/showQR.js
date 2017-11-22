const config = require('./config');
const logger = require('./log');
const qr = require('qrcode-terminal');
module.exports = uuid => {
  logger.debug(`扫描二维码登录`);
  qr.generate(config.url.getQR(uuid).uri, { small: true })
}
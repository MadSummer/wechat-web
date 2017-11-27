const qr = require('qrcode-terminal');
module.exports = content => {
  qr.generate(content, { small: true })
}
const qr = require('qr-image');
module.exports = content => qr.imageSync(content, {
  type: 'png'
});
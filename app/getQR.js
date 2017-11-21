const config = require('./config');
const fs = require('fs');
const rp = require('./rp');
const { exec } = require('child_process');
const log = require('./log');
module.exports = uuid => {
  return new Promise((onFullfilled,onRejected) => {
    rp
      .get(config.url.getQR(uuid))
      .pipe(fs.createWriteStream('./qr.png'))
      .on('finish', () => {
        exec('.\\qr.png', data => {
          log.debug('扫描二维码登录')
          onFullfilled(true);
        });
      })
  });
}
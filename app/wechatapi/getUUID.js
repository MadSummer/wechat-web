const config = require('../lib/config');
const logger = require('../lib/logger').logger;
const rp = require('../lib/rp');
module.exports =
  new Promise((onFullfilled, onRejected) => {
    rp
      .get(config.url.getUUID())
      .then(res => {
        let window = {
          QRLogin: {}
        }
        eval(res);
        onFullfilled(window.QRLogin.uuid);
      }, err => {
        onFullfilled();
        logger.error(err);
      });
  });
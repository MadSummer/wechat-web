const config = require('../lib/config');
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
      });
  });
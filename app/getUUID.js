const config = require('./config');
const rp = require('./rp');
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
const getUUIDOpt = require('../lib/getAPIRequestOption').getUUIDOpt;
const logger = require('../lib/logger');
const rp = require('../lib/rp');
module.exports = new Promise((onFullfilled, onRejected) => {
  rp
    .get(getUUIDOpt())
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
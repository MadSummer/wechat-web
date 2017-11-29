const getUUIDOpt = require('../lib/getAPIRequestOption').getUUIDOpt;
const logger = require('../lib/logger');
const rp = require('../lib/rp');
module.exports = () => {
  return rp
    .get(getUUIDOpt())
    .then(res => {
      let window = {
        QRLogin: {}
      }
      eval(res);
      return window.QRLogin.uuid;
    })
}
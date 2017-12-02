const getLoginOpt = require('../lib/getAPIRequestOption').getLoginOpt;
const logger = require('../lib/logger');
const rp = require('../lib/rp');

module.exports = (uuid, tip) => {
  return rp(getLoginOpt(uuid, tip))
    .then(res => {
      let window = {}
      if (res) {
        eval(res);
      }
      return window;
    })
}
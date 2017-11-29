const getLogoutOpt = require('../lib/getAPIRequestOption').getLogoutOpt;
const rp = require('../lib/rp');
module.exports = param => {
  return rp(getLogoutOpt(param))
    .then(res => {
      return true
    });
}
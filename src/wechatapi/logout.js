const getLogoutOpt = require('../lib/getAPIRequestOption').getLogoutOpt;
const rp = require('../lib/rp');
module.exports = param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(getLogoutOpt(param));
    p.then(res => {
      onFullfilled(true);
    }, err => {
      onFullfilled(true);
    });
  });
}
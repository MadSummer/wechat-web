const config = require('../lib/config');
const rp = require('../lib/rp');
module.exports = param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(config.url.logout(param));
    p.then(res => {
      onFullfilled(true);
    }, err => {
      onFullfilled(true);
    });
  });
}
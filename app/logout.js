const config = require('./config');
const rp = require('./rp');
const log = require('./log');
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
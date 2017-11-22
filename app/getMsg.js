const config = require('./config');
const rp = require('./rp');
const log = require('./log');
module.exports = param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp.get(config.url.getMsg(param));
    debugger
    p.then(res => {
      if (!res) onFullfilled(false);
      onFullfilled(res);
    });
  });
}
const config = require('../lib/config');
const rp = require('../lib/rp');
const log = require('../lib/log');
module.exports = (param,msg) => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(config.url.sendMsg(param,msg));
    p.then(res => {
      if (!res) onFullfilled(false);
      onFullfilled(res);
    });
  });
}
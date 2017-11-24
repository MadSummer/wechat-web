const config = require('../lib/config');
const rp = require('../lib/rp');
const log = require('../lib/log');
module.exports = (data,param) => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(config.url.sendMsg(data,param));
    p.then(res => {
      console.log(res);
      if (!res) onFullfilled(false);
      onFullfilled(res);
    });
  });
}
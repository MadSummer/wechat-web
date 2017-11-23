const config = require('./config');
const rp = require('./rp');
const log = require('./log');
module.exports = (param,msg) => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(config.url.sendMsg(param,msg));
    p.then(res => {
      if (!res) onFullfilled(false);
      onFullfilled(res);
    });
  });
}
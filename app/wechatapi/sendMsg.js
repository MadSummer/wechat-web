const config = require('../lib/config');
const logger = require('../lib/logger').logger;
const rp = require('../lib/rp');
module.exports = (data,msg) => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(config.url.sendMsg(data,msg));
    p.then(res => {
      if (!res) onFullfilled();
      onFullfilled(res);
    }, err => {
      onFullfilled();
      logger.error(err);
    });
  });
}
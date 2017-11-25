const config = require('../lib/config');
const logger = require('../lib/logger').logger;
const rp = require('../lib/rp');
module.exports = param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(config.url.getMsg(param));
    p.then(res => {
      if (!res) onFullfilled(false);
      onFullfilled(res);
    }, err => {
      onFullfilled();
      logger.error(err);
    });
  });
}
const  getMsgOpt  = require('../lib/getAPIRequestOption').getMsgOpt;
const logger = require('../lib/logger')
const rp = require('../lib/rp');
module.exports = param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(getMsgOpt(param));
    p.then(res => {
      if (!res) onFullfilled(false);
      onFullfilled(res);
    }, err => {
      onFullfilled();
      logger.error(err);
    });
  });
}
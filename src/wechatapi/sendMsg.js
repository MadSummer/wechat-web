const getSendMsgOpt = require('../lib/getAPIRequestOption').getSendMsgOpt;
const rp = require('../lib/rp');
/**
 * 
 * 
 * @param {object} data 
 * @param {object} msg 
 * @returns 
 */
const sendMsg = function (data, msg) {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(getSendMsgOpt(data, msg));
    p.then(res => {
      if (!res) onFullfilled();
      onFullfilled(res);
    }, err => {
      onFullfilled();
      logger.error(err);
    });
  });
}
module.exports =  sendMsg;
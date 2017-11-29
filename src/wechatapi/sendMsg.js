const getSendMsgOpt = require('../lib/getAPIRequestOption').getSendMsgOpt;
const rp = require('../lib/rp');
/**
 * 
 * @param {object} data 
 * @param {object} msg 
 * @returns 
 */
module.exports = (data, msg) => {
  return rp(getSendMsgOpt(data, msg))
    .then(res => {
      return res;
    });
}
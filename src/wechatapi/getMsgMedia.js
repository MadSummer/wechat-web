const getMsgImgOpt = require('../lib/getAPIRequestOption').getMsgImgOpt;
const getMsgVideoOpt = require('../lib/getAPIRequestOption').getMsgVideoOpt;
const getMsgFileOpt = require('../lib/getAPIRequestOption').getMsgFileOpt;
const rp = require('../lib/rp');
module.exports = (msg, type) => {
  switch (type) {
    case 'image':
      return rp(getMsgImgOpt())
      break;
    case 'video':

      break;
    case 'file':

      break;
    default:
      break;
  }
  return rp(checkMsgOpt(param))

}
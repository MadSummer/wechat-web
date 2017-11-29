const getMsgOpt = require('../lib/getAPIRequestOption').getMsgOpt;
const logger = require('../lib/logger')
const rp = require('../lib/rp');
module.exports = param => {
  return rp(getMsgOpt(param))
    .then(res => {
      return res;
    });
}
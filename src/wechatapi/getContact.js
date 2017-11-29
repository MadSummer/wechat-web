const getContactOpt = require('../lib/getAPIRequestOption').getContactOpt;
const {
  logger
} = require('../lib/logger');
const rp = require('../lib/rp');
module.exports = param => {
  return rp(getContactOpt(param))
    .then(res => {
      if (!res) return;
      res = JSON.parse(res);
      return res.MemberList
    });
}
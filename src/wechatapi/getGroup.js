const getGroupOpt = require('../lib/getAPIRequestOption').getGroupOpt;
const rp = require('../lib/rp');
module.exports = (param,list) => {
  return rp(getGroupOpt(param,list))
    .then(res => {
      if (!res) return;
      return res.ContactList;
    });
}
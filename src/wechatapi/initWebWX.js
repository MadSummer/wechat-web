const getInitWebWXOpt = require('../lib/getAPIRequestOption').getInitWebWXOpt;
const rp = require('../lib/rp');

module.exports =  param => {
  return rp(getInitWebWXOpt(param));
}
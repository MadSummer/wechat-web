const config = require('../lib/config');
const rp = require('../lib/rp');

module.exports = param => {
  return rp(config.url.initWebWX(param));
}
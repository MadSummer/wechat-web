const config = require('./config');
const rp = require('./rp');

module.exports = param => {
  return rp(config.url.initWebWX(param));
}
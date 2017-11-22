const config = require('./config');
const rp = require('./rp');

module.exports = param => {
  let p = rp(config.url.initWebWX(param));
  return p
}
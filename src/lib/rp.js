// need cookie
const rp = require('request-promise');
rp.defaults({
  jar: true
});
module.exports = rp;
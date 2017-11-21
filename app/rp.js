// need cookie
const rp = require('request-promise').defaults({
  jar: true
});
module.exports = rp;
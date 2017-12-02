// need cookie
const rp = require('request-promise').defaults({
  jar: true,
  simple:true
});
module.exports = rp;
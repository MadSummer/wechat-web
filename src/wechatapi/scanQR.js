const getLoginOpt = require('../lib/getAPIRequestOption').getLoginOpt;
const logger = require('../lib/logger');
const rp = require('../lib/rp');

module.exports = (uuid, tip) => new Promise((onFullfilled, onRejected) => {
  rp(getLoginOpt(uuid, tip)).then(res => {
    if (!res) return onRejected();
    let window = {}
    eval(res);
    onFullfilled(window);
  }, err => {
    onRejected(err);
  });

});


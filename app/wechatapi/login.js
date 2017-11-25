const config = require('../lib/config');
const logger = require('../lib/logger').logger;
const rp = require('../lib/rp');
let timer;
function login(uuid, tip) {
  return new Promise((onFullfilled, onRejected) => {
    loopGetURL(uuid,tip,onFullfilled,rp);
  });
}
function loopGetURL(uuid,tip,onFullfilled) {
  rp.get(config.url.login(uuid, tip)).then(res => {
    if (!res) return logger.fatal(`登录失败`);
    let window = {}
    eval(res);
    if (window.code == 201) {
      logger.debug('扫码成功，请点击确认登陆');
      timer = setTimeout(() => {
        loopGetURL(uuid,tip,onFullfilled);
      }, 1000);
    }
    if (window.code == 200) {
      logger.debug(`登录成功`);
      clearTimeout(timer);
      onFullfilled({
        redirect_uri: window.redirect_uri
      });
    }
    if (window.code == 408) {
      logger.fatal(`登录失败`);
      onFullfilled(false);
    }
  });
}
module.exports = login
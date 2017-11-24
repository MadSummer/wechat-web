const config = require('../lib/config');
const logger = require('../lib/log');
const xml2js = require('xml2js');
const rp = require('../lib/rp');
module.exports = redirect_uri => {
  return new Promise((onFullfilled, onRejected) => {
    rp
      .get(config.url.getRedicetURL(redirect_uri))
      .then(res => {
        xml2js.parseString(res, (err, result) => {
          if (err) return onFullfilled(false);
          let info = result.error;
          logger.debug(`正在获取个人信息`);
          onFullfilled({
            ret: info.ret[0],
            message: info.message[0],
            skey: info.skey[0],
            sid: info.wxsid[0],
            uin: info.wxuin[0],
            pass_ticket: info.pass_ticket[0],
            isgrarscale: info.isgrayscale[0]
          });
          //initWebWX();
        });
      }, err => {
        onFullfilled();
      });
  })
}
const getRedicetURLOpt = require('../lib/getAPIRequestOption').getRedicetURLOpt;
const logger = require('../lib/logger').logger;
const rp = require('../lib/rp');
const xml2js = require('xml2js');
module.exports = redirect_uri => {
  return new Promise((onFullfilled, onRejected) => {
    rp(getRedicetURLOpt(redirect_uri))
      .then(res => {
        xml2js.parseString(res, (err, result) => {
          if (err) return onFullfilled(false);
          let info = result.error;
          onFullfilled({
            ret: info.ret[0],
            message: info.message[0],
            skey: info.skey[0],
            sid: info.wxsid[0],
            uin: info.wxuin[0],
            pass_ticket: info.pass_ticket[0],
            isgrarscale: info.isgrayscale[0]
          });
        });
      }, err => {
        onFullfilled();
        logger.error(err)
      });
  })
}
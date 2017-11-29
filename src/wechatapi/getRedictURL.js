const getRedicetURLOpt = require('../lib/getAPIRequestOption').getRedicetURLOpt;
const rp = require('../lib/rp');
const xml2js = require('xml2js');
module.exports = async redirect_uri => {
  let res = await rp(getRedicetURLOpt(redirect_uri));
  let info = await new Promise((onFullfilled, onRejected) => {
    xml2js.parseString(res, (err, result) => {
      if (err) onFullfilled();
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
  });
  return info;
}
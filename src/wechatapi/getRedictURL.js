const getRedicetURLOpt = require('../lib/getAPIRequestOption').getRedicetURLOpt;
const rp = require('../lib/rp');
const xml2json = require('../lib/decodeXML2JSON');
module.exports = redirect_uri => {
  return rp(getRedicetURLOpt(redirect_uri))
    .then(res => {
      let info = xml2json(res);
      if (!info) return;
      info = info.error;
      return {
        ret: info.ret,
        message: info.message,
        skey: info.skey,
        sid: info.wxsid,
        uin: info.wxuin,
        pass_ticket: info.pass_ticket,
        isgrarscale: info.isgrayscale
      }
    })
}
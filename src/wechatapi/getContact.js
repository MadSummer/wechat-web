const  getContactOpt = require( '../lib/getAPIRequestOption').getContactOpt;
const { logger } = require('../lib/logger');
const rp =  require('../lib/rp');
module.exports =  param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp(getContactOpt(param));
    p.then(res => {
      if (!res) onFullfilled(false);
      res = JSON.parse(res);
      let obj = {
        MemberCount: res.MemberCount,
        male: 0,
        female: 0,
        MemberList: res.MemberList
      }
      res.MemberList.forEach(member => {
        if (member.Sex == 2) obj.female += 1;
        if (member.Sex == 1) obj.male += 1;
      });
      onFullfilled(obj);
    }, err => {
      onFullfilled();
      logger.error(err);
    });
  });
}
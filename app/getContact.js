const config = require('./config');
const rp = require('./rp');
const log = require('./log');
module.exports = param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp.get(config.url.getContact(param));
    p.then(res => {
      if (!res) onFullfilled(false);
      res = JSON.parse(res);
      let obj = {
        MemberCount: res.MemberCount,
        male: 0,
        female: 0
      }
      res.MemberList.forEach(member => {
        if (member.Sex == 2) obj.female += 1;
        if (member.Sex == 1) obj.male += 1;
      });
      log.debug(`共${obj.MemberCount}位联系人,男性${obj.male}人，女性${obj.female}人`)
      onFullfilled(obj);
    });
  });
}
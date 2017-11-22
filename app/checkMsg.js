const config = require('./config');
const rp = require('./rp');
const log = require('./log');
module.exports = param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp.get(config.url.checkMsg(param));
    debugger
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
      onFullfilled(obj);
    });
  });
}
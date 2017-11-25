const config = require('../lib/config');
const rp = require('../lib/rp');
module.exports = param => {
  return new Promise((onFullfilled, onRejected) => {
    let p = rp.get(config.url.checkMsg(param));
    let window = {};
    p.then(res => {
      if (!res) onFullfilled(false);
      // res = window.synccheck={retcode:"0",selector:"2"}
      // 0 正常
      // 2 新的消息
      // 7 进入/离开聊天界面
      eval(res);
      onFullfilled(window.synccheck);
    });
  });
}
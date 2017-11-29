const checkMsgOpt = require('../lib/getAPIRequestOption').getCheckMsgOpt;
const rp = require('../lib/rp');
module.exports = param => {
  let window = {};
  return rp(checkMsgOpt(param))
    .then(res => {
      if (!res) return;
      // res = window.synccheck={retcode:"0",selector:"2"}
      // 0 正常
      // 2 新的消息
      // 7 进入/离开聊天界面
      eval(res);
      return window.synccheck;
    });
}
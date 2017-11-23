const co = require('co');
const logger = require('./log');
const ora = require('ora');
const interactive = require('./interactive');

const getUUID = require('./getUUID');
const showQR = require('./showQR');
const login = require('./login');
const getRedictURL = require('./getRedictURL');
const initWebWX = require('./initWebWX');
const getContact = require('./getContact');
const checkMsg = require('./checkMsg');
const getMsg = require('./getMsg');
const sendMsg = require('./sendMsg');
const logout = require('./logout');
const emitter = require('./emitter');

let data = {
  autoGetMsg: true,
  showTips: true
};

const tools = {
  getMemberByUserName: UserName => {
    if (!data.MemberList) return logger.warn(`没有获取到联系人`);
    for (let i = 0; i < data.MemberList.length; i++) {
      const member = data.MemberList[i];
      if (member.UserName === UserName) {
        return member;
      }
    }
  }
}

const action = {
  getUUID: () => {
    return co(function* () {
      data.uuid = yield getUUID;
      if (!data.uuid) return logger.fatal(`获取UUID失败`);
    });
  },
  showQR: () => {
    showQR(data.uuid);
  },
  login: () => {
    return co(function* () {
      data.redirect_uri = (yield login(data.uuid, 1)).redirect_uri;
      if (!data.redirect_uri) return logger.fatal(`登录失败！`);
    })
  },
  getRedictURL: () => {
    return co(function* () {
      let info = yield getRedictURL(data.redirect_uri);
      if (!info) return logger.fatal(`获取跳转数据失败！`);
      Object.assign(data, info);
    })
  },
  initWebWX: () => {
    return co(function* () {
      let initData = yield initWebWX(data);
      if (!initData) return logger.fatal(`获取个人信息失败`);
      Object.assign(data, initData);
      logger.debug(`用户${initData.User.NickName}初始化成功`);
    });
  },
  getContact: () => {
    return co(function* () {
      let spinner = ora(`正在获取联系人...`).start();
      let obj = yield getContact(data);
      spinner.succeed('获取联系人完成');
      logger.debug(`共${obj.MemberCount}位联系人,男性${obj.male}人，女性${obj.female}人`);
      data.MemberList = obj.MemberList;
    });
  },
  checkMsg: () => {
    return co(function* () {
      if (data.showTips) logger.debug(`等待接受新消息...`);
      let res = yield checkMsg(data);
      if (!res) return logger.error(`获取新消息列表失败`);
      if (res.retcode == 1101) return logger.warn(`账号已退出，不再获取消息`);
      if (res.selector == 2) {
        yield action.getMsg();
      }
      if (data.autoGetMsg) {
        action.checkMsg();
      }
    });
  },
  getMsg: () => {
    return co(function* () {
      let res = yield getMsg(data);
      data.SyncCheckKey = res.SyncCheckKey
      data.SyncKey = res.SyncKey;
      if (res.AddMsgList.length > 0) {
        res.AddMsgList.forEach(msg => {
          let fromUser = tools.getMemberByUserName(msg.FromUserName);
          let toUser = tools.getMemberByUserName(msg.ToUserName);
          if (!fromUser) fromUser = { NickName: '<空>' }
          if (!toUser) toUser = { NickName: '<空>' }
          if (!msg.Content) {

          } else {
            if (toUser.UserName === data.User.UserName) {
              logger.debug(`${fromUser.NickName + (fromUser.RemarkName ? '(' + fromUser.RemarkName + ')' : '')}：${msg.Content}`);
            }
            if (fromUser.UserName === data.User.UserName) {
              logger.debug(`我发送给${toUser.NickName + (toUser.RemarkName ? '(' + toUser.RemarkName + ')' : '')}:${msg.Content}`);
            }
          }
        });
      }
    });
  },
  sendMsg: msg => {
    return co(function* () {
      yield sendMsg(data, msg);
    });
  },
  logout: () => {
    logger.debug('--logout')
    return co(function* () {
      let flag = yield logout(data);
      if (flag) return logger.debug('已退出当前账号');
    });
  },
  init: () => {
    logger.debug('init')
    return co(function* () {
      yield action.getUUID();
      action.showQR();
      yield action.login();
      yield action.getRedictURL();
      yield action.initWebWX();
      yield action.getContact();
      yield action.getMsg();
      action.checkMsg();
    });
  },
  closeTips: () => {
    data.showTips = false;
  }
}
const addEventListener = () => {
  for (const operation in action) {
    if (action.hasOwnProperty(operation)) {
      const handler = action[operation];
      emitter.on(operation, handler);
    }
  }
}
const listeningStdInput = function () {
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', val => {
    interactive(val.trim());
  });
}
const start = function () {
  co(function* () {
    //yield action.init();
    addEventListener();
    logger.info('请输入要执行的操作,如需帮助请输入 ?');
    listeningStdInput();
  });
}
start();
module.exports = action;
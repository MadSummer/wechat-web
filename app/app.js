/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-11-24 16:15:43
 */
const co = require('co');
const ora = require('ora');

const interactive = require('./lib/interactive');
const emitter = require('./lib/emitter');
const logger = require('./lib/log');
const showQR = require('./lib/showQR');
const config = require('./lib/config');

const getUUID = require('./wechatapi/getUUID');
const login = require('./wechatapi/login');
const getRedictURL = require('./wechatapi/getRedictURL');
const initWebWX = require('./wechatapi/initWebWX');
const getContact = require('./wechatapi/getContact');
const checkMsg = require('./wechatapi/checkMsg');
const getMsg = require('./wechatapi/getMsg');
const sendMsg = require('./wechatapi/sendMsg');
const logout = require('./wechatapi/logout');

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
    }).catch(err => {
      logger.error(err);
    });
  },
  showQR: () => {
    showQR(config.url.getQR(data.uuid).uri);
  },
  login: () => {
    return co(function* () {
      data.redirect_uri = (yield login(data.uuid, 1)).redirect_uri;
      if (!data.redirect_uri) return logger.fatal(`登录失败！`);
    }).catch(err => {
      logger.error(err);
    })
  },
  getRedictURL: () => {
    return co(function* () {
      let info = yield getRedictURL(data.redirect_uri);
      if (!info) return logger.fatal(`获取跳转数据失败！`);
      Object.assign(data, info);
    }).catch(err => {
      logger.error(err);
    })
  },
  initWebWX: () => {
    return co(function* () {
      let initData = yield initWebWX(data);
      if (!initData) return logger.fatal(`获取个人信息失败`);
      Object.assign(data, initData);
      logger.debug(`用户${initData.User.NickName}初始化成功`);
    }).catch(err => {
      logger.error(err);
    });
  },
  getContact: () => {
    return co(function* () {
      let spinner = ora(`正在获取联系人...`).start();
      let obj = yield getContact(data);
      spinner.succeed('获取联系人完成');
      logger.debug(`共${obj.MemberCount}位联系人,男性${obj.male}人，女性${obj.female}人`);
      data.MemberList = obj.MemberList;
    }).catch(err => {
      logger.error(err);
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
    }).catch(err => {
      logger.error(err);
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
    }).catch(err => {
      logger.error(err);
    });
  },
  sendMsg: msg => {
    return co(function* () {
      yield sendMsg(data, msg);
    }).catch(err => {
      logger.error(err);
    });
  },
  logout: () => {
    logger.debug('--logout')
    return co(function* () {
      let flag = yield logout(data);
      if (flag) return logger.debug('已退出当前账号');
    }).catch(err => {
      logger.error(err);
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
  },
  exit: () => {
    process.exit(0);
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
    yield action.init();
    addEventListener();
    logger.info('请输入要执行的操作,如需帮助请输入 ?');
    listeningStdInput();
  });
}
start();
module.exports = action;
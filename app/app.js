/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-11-25 15:26:54
 */
const co = require('co');
const ora = require('ora');

const interactive = require('./lib/interactive');
const emitter = require('./lib/emitter');
const log4js = require('./lib/logger');
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

const logger = log4js.logger;
const chatLogger = log4js.chat;
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
      logger.debug('getUUID err');
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
      logger.debug('login err');
      logger.error(err);
    })
  },
  getRedictURL: () => {
    return co(function* () {
      let info = yield getRedictURL(data.redirect_uri);
      if (!info) return logger.fatal(`获取跳转数据失败！`);
      Object.assign(data, info);
    }).catch(err => {
      logger.debug('getRedictURL err');
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
      logger.debug('initWebWX err')
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
      logger.debug('getContact err')
      logger.error(err);
    });
  },
  checkMsg: () => {
    return co(function* () {
      let res = yield checkMsg(data);
      if (!res) return logger.error(`获取新消息列表失败`);
      if (res.retcode == 1101) return logger.warn(`账号已退出`);
      if (res.selector == 2) {
        yield action.getMsg();
      }
      if (data.autoGetMsg) {
        action.checkMsg();
      }
    }).catch(err => {
      logger.debug('checkMsg err');
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
              chatLogger.debug(`${fromUser.NickName + (fromUser.RemarkName ? '(' + fromUser.RemarkName + ')' : '')}：${msg.Content}`);
            }
            if (fromUser.UserName === data.User.UserName) {
              chatLogger.debug(`我发送给${toUser.NickName + (toUser.RemarkName ? '(' + toUser.RemarkName + ')' : '')}:${msg.Content}`);
            }
          }
        });
      }
    }).catch(err => {
      logger.debug('getMsg err');
      logger.error(err);
    });
  },
  sendMsg: msg => {
    return co(function* () {
      if (!msg.content) logger.warn('不能发送空的消息');
      if (!msg.to) logger.warn('没有接收者');
      if (Number.isInteger(+msg.to)) {
        msg.ToUserName = data.MemberList[+msg.to].UserName;
      }
      msg.FromUserName = data.User.UserName;
      yield sendMsg(data, msg);
    }).catch(err => {
      logger.error(err);
    });
  },
  logout: () => {
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
    }).catch(err => {
      logger.debug('init err');
      logger.error(err);
    });
  },
  closeTips: () => {
    data.showTips = false;
  },
  showContact: param => {
    let members = `\r\n`;
    for (let i = param.start || 0; i < (param.end || data.MemberList.length); i++) {
      const member = data.MemberList[i];
      if (!member) break;
      members += `[${i}]${member.RemarkName}(${member.NickName})\r\n`;
    }
    logger.debug(members);
  },
  search: param => {
    let MemberList = data.MemberList;
    let members = `\r\n`;
    for (let i = 0; i < MemberList.length; i++) {
      const member = MemberList[i];
      if (member.NickName.indexOf(param.query) !== -1 ||
        member.RemarkName.indexOf(param.query) !== -1) {
        members += `[${i}]${member.RemarkName}(${member.NickName})\r\n`;
      }
    }
    logger.debug(members);
  },
  help: () => {
    interactive.showHelp();
  },
  setting: param => {
    if ('saveChatRecord' in param) {
      log4js.saveChatRecord(!!param.saveChatRecord);
    }
  },
  exit: () => {
    return co(function* () {
      yield action.logout();
      logger.debug(`退出程序`);
      process.exit(0);
    });
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
    interactive.parseStdin(val.trim());
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
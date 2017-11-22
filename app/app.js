const co = require('co');
const logger = require('./log');
const parseStdin = require('./parseStdin');
const ora = require('ora');

const getUUID = require('./getUUID');
const showQR = require('./showQR');
const login = require('./login');
const getRedictURL = require('./getRedictURL');
const initWebWX = require('./initWebWX');
const getContact = require('./getContact');
const checkMsg = require('./checkMsg');
const getMsg = require('./getMsg');
let data = {};


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
    })
  },
  getContact: () => {
    return co(function* () {
      const spinner = ora(`正在获取联系人...`).start();
      let obj = yield getContact(data);
      spinner.succeed('获取联系人完成');
      logger.debug(`共${obj.MemberCount}位联系人,男性${obj.male}人，女性${obj.female}人`)
    });

  },
  getMsg: () => {

  },
  sendMsg: (content, reciver) => {

  },
  logout: () => {

  }
}
function start() {
  co(function* () {
    yield action.getUUID();
    action.showQR();
    yield action.login();
    yield action.getRedictURL();
    yield action.initWebWX();
    yield action.getContact();
    //yield getMsg(data);
    //listeningStdin
    listeningStdin();
  });
}
function listeningStdin() {
  logger.info('请输入要执行的操作,如需帮助请输入?');
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', val => {
    parseStdin(val.trim());
  });
}

start();

module.exports = action;
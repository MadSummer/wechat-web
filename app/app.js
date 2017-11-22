const co = require('co');
const logger = require('./log');
const parseStdin = require('./parseStdin');
const ora = require('ora');

const getUUID = require('./getUUID');
const getQR = require('./getQR');
const login = require('./login');
const getRedictURL = require('./getRedictURL');
const initWebWX = require('./initWebWX');
const getContact = require('./getContact');

let uuid;
let info;
let initData;
let nickname;

start();

function start() {
  co(function* () {
    // get uuid
    uuid = yield getUUID;
    if (!uuid) return logger.fatal(`获取UUID失败`);

    // get qrcode
    let isGetQRSuccess = yield getQR(uuid);
    if (!isGetQRSuccess) return logger.fatal(`获取二维码失败`);

    // try login
    let loginData = yield login(uuid, 1);
    if (!loginData) return logger.fatal(`登录失败！`);

    // get redirect uri info
    info = yield getRedictURL(loginData.redirect_uri);
    if (!info) return logger.fatal(`获取跳转数据失败！`);

    // initWebWX
    initData = yield initWebWX(info);
    if (!initData) return logger.fatal(`获取个人信息失败`);
    logger.debug(`用户${initData.User.NickName}初始化成功`);

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

module.exports = {
  getContact: () => {
    co(function* () {
      const spinner = ora(``).start();
      logger.debug('正在获取联系人...')
      yield getContact(initData);
      spinner.succeed('');
      logger.debug('获取联系人完成')
    });
    
  }
}
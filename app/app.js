const co = require('co');
const logger = require('./log');
const xml2js = require('xml2js');
const commander = require('commander');

const getUUID = require('./getUUID');
const getQR = require('./getQR');
const login = require('./login');
const getRedictURL = require('./getRedictURL');
const initWebWX = require('./initWebWX');
const getContact = require('./getContact');
global.uuid;
global.info;
global.initData;
global.nickname;

commander
  .version('0.1.0')
  .option('-l, --login', '登录微信')
  .option('-c, --getContact', '获取联系人')
  .parse(process.argv);
if (commander.login) {
  start();
}
if (commander.getContact) {
  getContact(global.info);
}
function start() {
  co(function* () {
    // get uuid
    global.uuid = yield getUUID;
    if (!uuid) return logger.fatal(`获取UUID失败`);
    // get qrcode
    let isGetQRSuccess = yield getQR(uuid);
    if (!isGetQRSuccess) return logger.fatal(`获取二维码失败`);
    // try login
    let loginData = yield login(uuid, 1);
    if (!loginData) return logger.fatal(`登录失败！`);
    // get redirect uri info
    global.info = yield getRedictURL(loginData.redirect_uri);
    if (!info) return logger.fatal(`获取跳转数据失败！`);
    global.initData = yield initWebWX(info);
    if (!initData) return logger.fatal(`获取个人信息失败`);
    global.nickname = initData.User.NickName;
    logger.debug(`用户${nickname}初始化成功`);
  });
}
const wechat = require('./src/node-wechat');
const logger = require('./logger');
const qrTerminal = require('qrcode-terminal');
const ora = require('ora');
let spinner
process.stdin.addListener('data', function (data) {
  logger.debug(data.toString())
})
wechat
  .on('qr', data => {
    qrTerminal.generate(data.url, {
      small: true
    })
  })
  .on('qr.waiting', data => {
    logger.debug('扫码成功，点击确认登录')
  })
  .on('init', user => {
    logger.debug(`用户${user.NickName}初始化成功`)
  })
  .on('get.contact.start', () => {
    spinner = ora('正在获取联系人').start()
  })
  .on('get.contact.end', members => {
    spinner.succeed(`获取联系人完成`);
    logger.debug(`获取到${members.length}个联系人`)
  })
  .on('message', data => {
    data.forEach(msg => {
      switch (msg.MsgType) {
        case 1:
          logger.debug(`${msg.FromUser.NickName} to ${msg.ToUser.NickName}:${msg.Content}`)
          break;
        case 3:
          //logger.debug(`${msg.FromUser.NickName} to ${msg.ToUser.NickName}:${msg.Content}`)
          break;
        default:
          break;
      }
    })
  })
  .on('send', data => {
    logger.debug(data)
  })
  .on('logout', data => {
    logger.debug('账号退出')
  })
  .init()


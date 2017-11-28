const yargs = require('yargs');
const chalk = require('chalk');
const wechat = require('./src/node-wechat');
const logger = require('./logger');
const qrTerminal = require('qrcode-terminal');
const ora = require('ora');
let spinner;

const showHelp = () => {
  logger.debug(chalk.green(`
  Options:
  help            显示帮助
  init            重新登陆
  send            发送消息
    --to          消息接受者
    --content     消息内容
  logout          退出账号
  exit            退出程序
  `));
}

function parseStdin(stdin) {
  const input = yargs.help(false).parse(stdin);
  const action = input._[0];
  if (action === 'help') {
    showHelp()
  }
  if (action === 'send') {
    wechat.sendMsg()
  }
  if (action === 'search') {
    logger.debug(`查找包含${input.query}的用户`);
    let result = wechat.search({
      query:input.query
    });
    logger.debug(result);
  }
}

process.stdin.addListener('data', function (data) {
  parseStdin(data.toString());
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
    let result = wechat.search({
      query:'文件'
    });
    logger.debug(result);
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
  .init();


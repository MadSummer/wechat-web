const logger = require('./log');
const yargs = require('yargs');
const chalk = require('chalk');
const showHelp = () => {
  logger.debug(chalk.green(`
  Options:
  --help,-?     显示帮助
  --init,-i     重新登陆
  --contact,-t  获取联系人
  --get,-g      获取消息
  --send,-s     发送消息
  --reciver,-r  消息接受者
  --content,-c  消息内容
  --logout,-o   退出账号
  --exit,-e     退出程序
  `));
}
function parseStdin(stdin) {
  let action = yargs.help(false).parse(stdin);
  if (action.send || action.s) {
    if (!action.content || action.content === true) logger.error('请输入消息内容')
    logger.debug(`发送消息：${action.content}`)
    return;
  }
  if (action.get || action.g) {
    logger.debug(`获取消息`)
    return;
  }
  if (action.help || action['?']) {
    showHelp();
    return;
  }
  if (action.exit || action.e) {
    logger.warn('退出程序');
    process.exit(0);
    return;
  }
  if (action.contact || action.t) {
    require('./app').getContact();
    return;
  }
  if (action.logout || action.o) {
    require('./app').logout();
    return;
  }
  if (action.init || action.i) {
    require('./app').init();
    return;
  }
  return logger.warn(`输入命令有误，查看所有命令请输入 -? 或者 --help`);
}

module.exports = parseStdin;
const logger = require('./log');
const yargs = require('yargs');
const chalk = require('chalk');
const showHelp = () => {
  logger.debug(chalk.green(`
  Options:
  --help,-?     显示帮助
  --contact,-ct 获取联系人
  --get,-g      获取消息
  --send,-s     发送消息
  --reciver,-r  消息接受者
  --content,-c  消息内容
  --exit,-e     退出程序
  `));
}
showHelp()
function std(stdin) {
  let action = yargs.help(false).parse(stdin);
  if (action.send || action.s) {
    if (!action.content || action.content === true) logger.error('请输入消息内容')
    logger.debug(`发送消息：${action.content}`)
  }
  if (action.get || action.g) {
    logger.debug(`获取消息`)
  }
  if (action.help || action['?']) {
    showHelp()
  }
  if (action.exit || action.e) {
    logger.warn('退出程序');
    process.exit(0)
  }
  if (action.contact || action.ct) {
    require('./app').getContact()
  }
}

module.exports = std;
const logger = require('./log');
const yargs = require('yargs');
const chalk = require('chalk');
const emitter = require('./emitter');
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
  const input = yargs.help(false).parse(stdin);
  const action = input._[0];
  emitter.emit(action, input);
}

module.exports = parseStdin;
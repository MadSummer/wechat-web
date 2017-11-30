const yargs = require('yargs');
const chalk = require('chalk');
const wechat = require('./src/node-wechat');
const logger = require('./logger');
const qrTerminal = require('qrcode-terminal');
const ora = require('ora');
const inquirer = require('inquirer');
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
    showHelp();
  }
  if (action === 'send') {
    wechat.sendMsg({
      content: input.content,
      to: input.to
    })
  }
  if (action === 'search') {
    logger.debug(`查找包含${input.query}的用户`);
    let query = input.query.trim();
    let result = wechat.search({
      query
    });
    logger.debug(result);
  }
}
wechat
  .on('qr.get', data => {
    qrTerminal.generate(data.url, {
      small: true
    })
  })
  .on('qr.waiting', data => {
    logger.debug('扫码成功，点击确认登录')
  })
  .on('init', data => {
    logger.debug(`用户${data.User.NickName}初始化成功`);
    /* inquirer.prompt(questions).then(answers => {
      console.log('\nOrder receipt:');
      console.log(JSON.stringify(answers, null, '  '));
    }); */
  })
  .on('contact.get.start', () => {
    spinner = ora('正在获取联系人').start()
  })
  .on('contact.get.end', members => {
    spinner.succeed(`获取联系人完成`);
    logger.debug(`获取到${members.length}个联系人`)
  })
  .on('message', data => {
    data.forEach(msg => {
      switch (msg.MsgType) {
        case 1:
          let [fn, fr, tn, tr, gs] = [
            msg.FromUser.NickName,
            msg.FromUser.RemarkName === '' ? '' : `(${msg.FromUser.RemarkName})`,
            msg.ToUser.NickName,
            msg.ToUser.RemarkName === '' ? '' : `(${msg.ToUser.RemarkName})`,
            msg.isGroupMsg ?
              (msg.GroupMsgSenderUser.RemarkName
                || msg.GroupMsgSenderUser.DisplayName
                || msg.GroupMsgSenderUser.NickName) + ':'
              : ''
          ]
          let msgDetails
          if (msg.isGroupMsg) {
            let groupNickName = msg.FromUser.UserName === wechat.data.User.UserName ? tn : fn;
            msgDetails = `群消息(${groupNickName}) : ${gs}${msg.Content}`;
          } else {
            msgDetails = `${fn}${fr} to ${tn}${tr} : ${msg.Content}`;
          }
          logger.debug(msgDetails);
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
  .on('error', error => {
    logger.error(error);
  })
  .init();

var questions = [{
  type: 'confirm',
  name: 'toBeDelivered',
  message: 'Is this for delivery?',
  default: false
},
{
  type: 'input',
  name: 'phone',
  message: "What's your phone number?",
  validate: function (value) {
    var pass = value.match(
      /^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i
    );
    if (pass) {
      return true;
    }

    return 'Please enter a valid phone number';
  }
},
{
  type: 'list',
  name: 'size',
  message: 'What size do you need?',
  choices: ['Large', 'Medium', 'Small'],
  filter: function (val) {
    return val.toLowerCase();
  }
},
{
  type: 'input',
  name: 'quantity',
  message: 'How many do you need?',
  validate: function (value) {
    var valid = !isNaN(parseFloat(value));
    return valid || 'Please enter a number';
  },
  filter: Number
},
{
  type: 'expand',
  name: 'toppings',
  message: 'What about the toppings?',
  choices: [{
    key: 'p',
    name: 'Pepperoni and cheese',
    value: 'PepperoniCheese'
  },
  {
    key: 'a',
    name: 'All dressed',
    value: 'alldressed'
  },
  {
    key: 'w',
    name: 'Hawaiian',
    value: 'hawaiian'
  }
  ]
},
{
  type: 'rawlist',
  name: 'beverage',
  message: 'You also get a free 2L beverage',
  choices: ['Pepsi', '7up', 'Coke']
},
{
  type: 'input',
  name: 'comments',
  message: 'Any comments on your purchase experience?',
  default: 'Nope, all good!'
},
{
  type: 'list',
  name: 'prize',
  message: 'For leaving a comment, you get a freebie',
  choices: ['cake', 'fries'],
  when: function (answers) {
    return answers.comments !== 'Nope, all good!';
  }
}
];
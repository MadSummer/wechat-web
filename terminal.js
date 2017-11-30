const yargs = require('yargs');
const chalk = require('chalk');
const wechat = require('./src/node-wechat');
const logger = require('./logger');
const qrTerminal = require('qrcode-terminal');
const ora = require('ora');
const inquirer = require('inquirer');
let spinner;
process.on('uncaughtException', () => {

})
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
    showAction();
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
          let gs = msg.isGroupMsg ?
            (msg.GroupMsgSenderUser.RemarkName
              || msg.GroupMsgSenderUser.DisplayName
              || msg.GroupMsgSenderUser.NickName) + ':'
            : ''
          let msgDetails;
          if (msg.isGroupMsg) {
            let groupNickName = msg.FromUser.UserName === wechat.data.User.UserName ? tn : fn;
            msgDetails = `群消息(${groupNickName}) : ${gs}${msg.Content}`;
          } else {
            msgDetails = `${wechat.getFullName(msg.FromUser)} to ${wechat.getFullName(msg.ToUser)} : ${msg.Content}`;
          }
          logger.debug(msgDetails);
          break;
        case 3:
          //logger.debug(`${msg.FromUser.NickName} to ${msg.ToUser.NickName}:${msg.Content}`)
          break;
        default:
          break;
      }
    });
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
function showAction() {
  const actionQuestion = [
    {
      type: 'list',
      name: 'action',
      message: '请选择操作',
      choices: [
        {
          name: '查找联系人',
          value: 'search'
        },
        {
          name: '发送消息',
          value: 'send'
        },
        {
          name: '退出账号',
          value: 'logout'
        },
        {
          name: '退出程序',
          value: 'exit'
        }
      ]
    }
  ];
  inquirer.prompt(actionQuestion).then(answer => {
    switch (answer.action) {
      case 'search':
        search();
        break;

      default:
        break;
    }
  });
}
function sendMsg() {
  const sendMsgQuestion = [
    {

    }
  ]
}

function search() {
  const searchQuestion = [
    {
      type: 'input',
      name: 'kw',
      message: '请输入关键字(昵称或者备注):',
      validate: str => str.trim() === '' ? '输入不能为空' : true
    }
  ]
  inquirer.prompt(searchQuestion).then(answer => {
    let result = wechat.searchContact({
      kw: answer.kw
    });
    if (result.length == 0) {
      logger.warn(`未查找到任何联系人:${answer.kw}`);
      showAction();
    } else {
      const memberChioce = [];
      result.forEach(member => {
        memberChioce.push({
          name: wechat.getFullName(member),
          value: member.UserName
        });
      });
      showMember(memberChioce)
    }
  });
}
function showMember(memberList) {
  const memberQuestion = [{
    type: 'list',
    name: 'member',
    message: '请选择联系人',
    choices: memberList.slice()
  }];
  memberQuestion[0].choices.push({
    name: '返回主菜单',
    value: '0'
  })
  inquirer.prompt(memberQuestion).then(answer => {
    if (answer.member === '0') {
      showAction();
    } else {
      showMemberAction(answer.member, memberList);
    }

  });
}

function showMemberAction(member, memberList) {
  const memberActionQuestion = [{
    type: 'list',
    name: 'memberAction',
    message: '请选择操作',
    choices: [
      {
        name: '发送消息',
        value: 'send'
      },
      {
        name: '查看详情',
        value: 'info'
      },
      {
        name: '返回上一级',
        value: '0'
      }
    ]
  }];
  inquirer.prompt(memberActionQuestion).then(answer => {
    if (answer.memberAction === '0') {
      if (memberList) return showMember(memberList);
      showAction();
    }
  })
}

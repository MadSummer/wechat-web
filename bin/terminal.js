/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-08 12:26:05
 */
const NodeWechat = require('../index');
const logger = require('../logger');
const qrTerminal = require('qrcode-terminal');
const ora = require('ora');
const inquirer = require('inquirer');
process.on('uncaughtException', () => {
  interactive.toggleMenu()
});
const interactive = {
  showAction: () => {
    const qus = {
      type: 'list',
      name: 'action',
      message: '请选择操作',
      prefix: '--',
      choices: [{
        name: '查找联系人',
        value: 'search'
      },
      {
        name: '退出账号',
        value: 'logout'
      }
      ]
    }
    inquirer.prompt(qus).then(answer => {
      switch (answer.action) {
        case 'search':
          interactive.searchContact();
          break;
        case 'logout':
          interactive.logout()
          break;
        default:
          interactive.toggleMenu();
          break;
      }
    });
  },
  searchContact: () => {
    const qus = [{
      type: 'input',
      name: 'kw',
      message: '请输入关键字(昵称或者备注):',
      validate: str => str.trim() === '' ? '输入不能为空' : true
    }]
    inquirer.prompt(qus).then(answer => {
      let result = wechat.searchInMemberList({
        kw: answer.kw
      });
      if (result.length == 0) {
        logger.warn(`未查找到任何联系人:${answer.kw}`);
        interactive.showAction();
      } else {
        const memberList = [];
        result.forEach(member => {
          memberList.push({
            name: member.FullName,
            value: member
          });
        });
        interactive.showMemberList(memberList)
      }
    });
  },
  showMemberList: function showMember(memberList) {
    const qus = [{
      type: 'list',
      name: 'member',
      message: '请选择联系人',
      choices: memberList.slice()
    }];
    qus[0].choices.push({
      name: '返回上一级',
      value: 0
    })
    inquirer.prompt(qus).then(answer => {
      if (answer.member === 0) {
        interactive.showAction();
      } else {
        interactive.showMemberAction(answer.member, memberList);
      }
    });
  },
  showMemberAction: (member, memberList) => {
    const qus = [{
      type: 'list',
      name: 'memberAction',
      message: '请选择操作',
      suffix: '输入数字进入操作：',
      choices: [{
        name: '发送消息',
        value: 1
      },
      {
        name: '查看详情',
        value: 2
      },
      {
        name: '返回上一级',
        value: 0
      }
      ]
    }];
    inquirer.prompt(qus).then(answer => {
      switch (answer.memberAction) {
        case 1:
          interactive.sendMsg(member);
          break;
        case 2:

          break;
        case 0:

          break;
        default:
          break;
      }
      if (answer.memberAction === 0) {
        if (memberList) return interactive.showMemberList(memberList);
        interactive.showAction();
      }
    })
  },
  logout: () => {
    const qus = {
      type: 'confirm',
      message: '确认退出当前账号吗？',
      name: 'logout'
    }
    inquirer.prompt(qus).then(answer => {
      if (answer.logout) {
        wechat.logout();
      }
    })
  },
  setting: () => {

  },
  sendMsg: member => {
    const qus = [{
      type: 'input',
      name: 'content',
      message: '请输入消息内容：'
    },
    {
      type: 'confirm',
      name: 'send',
      default: true,
      message: `发送消息给${wechat.getFullName(member)},回车默认确认`,
      when: answer => {
        return !!answer.content
      }
    }
    ];
    inquirer.prompt(qus).then(answer => {
      if (answer.send && answer.content) {
        wechat.sendMsg({
          content: answer.content,
          to: member.UserName
        });
        interactive.sendMsg(member);
      } else {
        interactive.showMemberAction(member);
      }
    });
  },
  toggleMenu: () => {
    logger.debug(`输入 ? 或者 help 开启菜单`);
    process.stdin.on('data', function input(data) {
      data = data.toString().trim();
      if (data === 'help' || data === '?') {
        process.stdin.removeListener('data', input);
        interactive.showAction();
      }
    });
  }
}
new NodeWechat()
  .on('qr.get', data => {
    qrTerminal.generate(data.url, {
      small: true
    });
  })
  .on('qr.waiting', data => {
    logger.debug('扫码成功，点击确认登录')
  })
  .on('init', data => {
    logger.debug(`用户${data.User.NickName}初始化成功`);
    interactive.toggleMenu();
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
      let msgDetails;
      if (msg.isGroupMsg()) {
        msgDetails = `群消息(${msg.FromGroup.getFullName()}) : ${msg.FromUser.getFullName()} : `
      } else {
        msgDetails = `${msg.FromUser.getFullName()} to ${msg.ToUser.getFullName()} : `;
      }
      switch (msg.MsgType) {
        case 1:
          msgDetails += `${msg.Content}`;
          break;
        case 3:
          msgDetails += `发了一张图片`;
          break;
        case 42:
          msgDetails += `分享名片\n昵称：${msg.Content.NickName}\n`;
          msgDetails += `性别：${msg.Content.Sex == 2 ? '女' : msg.Content.Sex == 1 ? '男' : '未知'}\n`;
          msgDetails +=`所在地：${msg.Content.Province}\n`
          msgDetails += `微信号：${msg.Content.WechatNum}`;
          break
        case 43:
          msgDetails += `发了一个视频`;
          break;
        case 49:
          switch (msg.shareType) {
            case 3:
              msgDetails += `分享音乐：\n歌名：${msg.Content.title}\n`;
              msgDetails += `描述：${msg.Content.desc}\n地址：${msg.Content.url}\n`;
              msgDetails += `应用名称：${msg.Content.appname}`;
              break;
            case 5:
              msgDetails += `分享链接：\n标题：${msg.Content.title}\n`;
              msgDetails += `描述：${msg.Content.desc}\n地址：${msg.Content.url}\n`;
              msgDetails += `应用名称：${msg.Content.appname}`;
              break;
            case 6:
              msgDetails += `发来文件：\n文件名：${msg.Content.title}\n`;
              msgDetails += `大小：${(msg.Content.size / 1024).toFixed(2)}kb`;
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
      logger.debug(msgDetails);
    });
  })
  .on('message.media', ({
    msg
  }) => {
    let info = `${msg.FromUser.getFullName()} 发送的`;
    info += `${msg.MsgType == 3 ? '图片' : msg.MsgType == 43 ? '视频' : '文件 '}`;
    info += `下载完成，文件路径：${msg.FilePath}`;
    logger.debug(info);
  })
  .on('send', data => {
    //logger.debug(data)
  })
  .on('logout', data => {
    logger.warn('账号退出')
  })
  .on('error', error => {
    logger.error(error);
  })
  .init();
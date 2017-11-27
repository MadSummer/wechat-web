const log4js = require('log4js');
const conf = {
  appenders: {
    file: {
      type: 'file',
      filename: 'log.log'
    },
    log: {
      type: 'console'
    },
    chat: {
      type: 'file',
      filename: 'chat-record.log'
    }
  },
  categories: {
    default: {
      appenders: ['file', 'log'],
      level: 'debug'
    },
    chat: {
      appenders: [],
      level: 'debug'
    }
  }
}
log4js.configure(conf);
let logger = log4js.getLogger();
let chatLogger = log4js.getLogger('chat');
let saveChatRecord = flag => {
  if (flag) {
    conf.categories.chat.appenders = ['chat', 'log'];
  } else {
    conf.categories.chat.appenders = ['log'];
  }
  log4js.shutdown(() => {
    log4js.configure(conf);
  });

}
module.exports = {
  logger,
  chatLogger,
  saveChatRecord
}

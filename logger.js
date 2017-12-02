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
      appenders: ['log'],
      level: 'debug'
    },
    chat: {
      appenders: ['chat'],
      level: 'debug'
    }
  }
}
log4js.configure(conf);
module.exports = log4js.getLogger();

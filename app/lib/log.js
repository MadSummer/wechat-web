const log4js = require('log4js');
log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: 'log.log'
    },
    log: {
      type:'console'
    }
  },
  categories: {
    default: {
      appenders: ['file', 'log'],
      level: 'debug'
    },
    command: {
      appenders: ['file', 'log'],
      level: 'debug'
    }
  }
});

const logger = log4js.getLogger();
module.exports = logger;
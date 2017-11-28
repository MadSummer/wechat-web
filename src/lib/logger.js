const log4js = require('log4js');
const conf = {
  appenders: {
    file: {
      type: 'file',
      filename: 'log.log'
    },
    log: {
      type: 'console'
    }
  },
  categories: {
    default: {
      appenders: ['file', 'log'],
      level: 'debug'
    }
  }
}
log4js.configure(conf);
let logger = log4js.getLogger();
module.exports = logger

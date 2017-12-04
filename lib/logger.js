/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-04 14:16:31
 */
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

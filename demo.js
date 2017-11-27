const wechat = require('./src/node-wechat');
const logger = require('./logger');
wechat
  .on('init', data => {
    logger.debug(`初始化成功`)
  })
  .on('')


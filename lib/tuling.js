const rp = require('request-promise');
const config = require('../config');
/**
 * tuling robot
 * @param {string} text - 消息内容
 * @param {string} userId - 用户id
 */
async function robot(text,userId) {
  return rp(config.TULING_API, {
    method: 'POST',
    json: {
      key: config.TULING_API_KEY,
      info: text,
      userid: userId
    }
  })
}
module.exports = robot;

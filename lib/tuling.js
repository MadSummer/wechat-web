const rp = require('request-promise');
const TULING_API = 'http://www.tuling123.com/openapi/api';
const TULING_API_KEY = '5a0d9cafeb7243afbc66a17613624c59';
/**
 * 
 * 
 * @param {string} text - 消息内容
 */
async function robot(text) {
  return rp(TULING_API, {
    method: 'POST',
    json: {
      key: TULING_API_KEY,
      info: text,
      userid: 'l59850'
    }
  })
}
module.exports = robot;
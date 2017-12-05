const tough = require('tough-cookie');
const Cookie = tough.Cookie;
const jsonfile = require('jsonfile');
/**
 * 
 * 
 * @param {Response} response 
 */
module.exports = response => {
  let setCookie = response.headers['set-cookie'];
  let cookieJSON = jsonfile.readFileSync('../cookie.json');
  for (let i = 0; i < setCookie.length; i++) {
    const str = setCookie[i];
    let cookie = Cookie.parse(str);
    if (!cookieJSON[cookie.domain]) {
      cookieJSON[cookie.domain] = {}
    }
    if (!cookieJSON[cookie.domain][cookie.path]) {
      cookieJSON[cookie.domain][cookie.path] = {}
    }
    cookieJSON[cookie.domain][cookie.path][cookie.key] = cookie.toJSON()
  }
  jsonfile.writeFileSync('../cookie.json', cookieJSON);
}
const tough = require('tough-cookie');
const Cookie = tough.Cookie;
const jsonfile = require('jsonfile');
const FileCookieStore = require('tough-cookie-file-store');
const path = require('path');
/**
 * 
 * cookie tools
 * @param {Response} response 
 */
const isCookieExpires = cookie => {
  return +new Date(cookie.expires) < +new Date()
}
/**
 * 
 * 
 * @param {any} response 
 * @returns 
 */
const updateCookieJSON = response => {
  if (!response) return;
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
const getCookiesStore = () => {
  return new FileCookieStore(path.resolve(__dirname, '../cookie.json'))
}
module.exports = {
  isCookieExpires,
  updateCookieJSON,
  getCookiesStore
}
const tough = require('tough-cookie');
const Cookie = tough.Cookie;
const fse = require('fs-extra');
const FileCookieStore = require('tough-cookie-file-store');
const path = require('path');

const writeCookieJSON = json => {
  let file = path.resolve(__dirname, '../cookie.json');
  let options = {
    spaces: 2,
    EOL: '\r\n'
  }
  fse.outputJsonSync(file, json, options);
}
const readCookieJSON = () => {
  let file = path.resolve(__dirname, '../cookie.json');
  let options = {
    throws: false
  }
  return fse.readJSONSync(file, options);
}
/**
 * 
 * cookie tools
 * @param {Response} response 
 */
const isCookieExpired = cookie => {
  return +new Date(cookie.expires) < +new Date(new Date().toISOString())
}
const setCookieExpired = cookie => {
  let cookiedomain = cookie.domain;
  let cookiepath = cookie.path;
  let cookieJSON = readCookieJSON();
  cookieJSON[cookiedomain][cookiepath][cookie.key].expires = new Date(+new Date() - 1111111111111).toISOString();
  writeCookieJSON(cookieJSON);
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
  let cookieJSON = readCookieJSON() || {};
  if (!setCookie) return;
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
  writeCookieJSON(cookieJSON);
}
const getCookiesStore = () => {
  let cookieJSON = readCookieJSON();
  let cookieStr = '';
  if (cookieJSON)
    try {
      return new FileCookieStore(path.resolve(__dirname, '../cookie.json'));
    } catch (error) {
      return;
    }

}
module.exports = {
  isCookieExpired,
  updateCookieJSON,
  getCookiesStore,
  setCookieExpired
}
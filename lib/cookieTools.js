const tough = require('tough-cookie');
const Cookie = tough.Cookie;
const jsonfile = require('jsonfile');
const FileCookieStore = require('tough-cookie-file-store');
const path = require('path');

const writeCookieJSON = json => {
  jsonfile.writeFileSync(
    path.resolve(__dirname, '../cookie.json'),
    json,
    {
      spaces: 2,
      EOL: '\r\n'
    });
}
const readCookieJSON = () => {
  return jsonfile.readFileSync(path.resolve(__dirname, '../cookie.json'), {
    throws: false
  });
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
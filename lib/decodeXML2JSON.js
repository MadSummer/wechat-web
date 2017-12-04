/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-04 14:16:18
 */
const entities = require('entities');
const xml2js = require('xml2js');
module.exports = xmlstr => {
  let json;
  let decodeXML = entities.decodeXML(xmlstr).replace(/\<br\/\>/g, '')
  xml2js.parseString(decodeXML, {
    explicitArray: false
  }, (err, res) => {
    if (err) return;
    json = res;
  });
  return json;
}
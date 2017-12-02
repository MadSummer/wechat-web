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
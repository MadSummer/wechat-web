/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-04 14:08:53
 */
const qr = require('qr-image');
module.exports = content => qr.imageSync(content, {
  type: 'png'
});
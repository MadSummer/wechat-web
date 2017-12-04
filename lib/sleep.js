/*
 * @Author: Liu Jing 
 * @Date: 2017-11-24 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-04 14:16:49
 */
module.exports = delay => new Promise((onFullfilled, onRejected) => {
  setTimeout(() => {
    onFullfilled()
  }, delay);
})
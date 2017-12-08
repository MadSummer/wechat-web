/*
 * @Author: Liu Jing 
 * @Date: 2017-12-08 11:10:55 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-08 11:12:06
 */
/**
 * @module tools
 */
module.exports = {
  /**
   * sleep
   * @param {number} ms 
   */
  sleep: ms => new Promise(onFullfilled => setTimeout(onFullfilled, ms))
}
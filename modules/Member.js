/*
 * @Author: Liu Jing 
 * @Date: 2017-12-03 15:19:31 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-04 14:49:34
 */
class Member {
  constructor(obj) {
    this.__init(obj);
  }
  __init(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        this[key] = element;
      }
    }
  }
  getFullName() {
    return this.RemarkName || this.DisplayName || this.NickName;
  }
  isGroup() {
    return this.UserName.indexOf('@@') !== -1;
  }
}
module.exports = Member;
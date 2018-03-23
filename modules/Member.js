/*
 * @Author: Liu Jing
 * @Date: 2017-12-03 15:19:31
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2018-03-23 15:41:59
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
    this.robot = false;
  }
  getFullName() {
    return this.RemarkName || this.DisplayName || this.NickName;
  }
  isGroup() {
    return this.UserName.indexOf('@@') !== -1;
  }
  changeRobotReplay(flag){
    this.robot = flag;
  }
}
module.exports = Member;

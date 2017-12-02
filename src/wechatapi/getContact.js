const getContactOpt = require('../lib/getAPIRequestOption').getContactOpt;
const getGroupOpt = require('../lib/getAPIRequestOption').getGroupOpt;
const rp = require('../lib/rp');
module.exports = param => {
  return rp(getContactOpt(param))
    .then(res => {
      if (!res) return;
      res = JSON.parse(res);
      return res.MemberList
    })
    .then(memberList => {
      let groupList = [];
      function addToGroup(newGroup) {
        for (let i = 0; i < groupList.length; i++) {
          const group = groupList[i];
          if (group.UserName == newGroup.UserName) return;
        }
        groupList.push(newGroup);
      }
      // 获取保存到通讯录的群组
      for (let i = 0; i < memberList.length; i++) {
        const member = memberList[i];
        if (member.UserName && member.UserName.indexOf('@@') != -1) {
          addToGroup.call(this, {
            EncryChatRoomId: '',
            UserName: member.UserName
          });
          memberList.splice(i, 1);
        }
      }
      // 获取最近联系的群组，包含未保存到通讯录的
      for (let i = 0; i < param.ContactList.length; i++) {
        const member = param.ContactList[i];
        if (member.UserName && member.UserName.indexOf('@@') != -1) {
          addToGroup.call(this, {
            EncryChatRoomId: '',
            UserName: member.UserName
          });
        }
      }
      return rp(getGroupOpt(param, groupList))
        .then(res => {
          if (!res) return;
          return memberList.concat(res.ContactList);
        });
    });
}
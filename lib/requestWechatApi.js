/*
 * @Author: Liu Jing 
 * @Date: 2017-12-04 15:39:13 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-04 18:12:02
 */
const xml2json = require('./decodeXML2JSON');
const getRequestOpt = require('./getAPIRequestOption');
const rp = require('request-promise').defaults({
  jar: true,
  simple: true
});
module.exports = {
  getQRcode: () => {
    return rp
      .get(getRequestOpt.uuidOpt())
      .then(res => {
        let window = {
          QRLogin: {}
        }
        eval(res);
        return window.QRLogin.uuid;
      }).then(uuid => {
        return {
          uuid,
          uri:getRequestOpt.QRcodeOpt(uuid).uri
        }
      })
  },
  QRcodeScanResult: (uuid, tip) => {
    return rp(getRequestOpt.QRcodeScanResult(uuid, tip))
      .then(res => {
        let window = {}
        if (res) {
          eval(res);
        }
        return window;
      })
  },
  login: redirect_uri => {
    return rp(getRequestOpt.redicetURLOpt(redirect_uri))
      .then(res => {
        let info = xml2json(res);
        if (!info) return;
        info = info.error;
        return {
          ret: info.ret,
          message: info.message,
          skey: info.skey,
          sid: info.wxsid,
          uin: info.wxuin,
          pass_ticket: info.pass_ticket,
          isgrarscale: info.isgrayscale
        }
      }).then(info => {
        if (!info) return;
        return rp(getRequestOpt.initWebWXOpt(info)).then(res => {
          Object.assign(info, res);
          return info;
        });
      })
  },
  checkMsg: param => {
    let window = {};
    return rp(getRequestOpt.checkMsgOpt(param))
      .then(res => {
        if (!res) return;
        // res = window.synccheck={retcode:"0",selector:"2"}
        // 0 正常
        // 2 新的消息
        // 7 进入/离开聊天界面
        eval(res);
        return window.synccheck;
      });
  },
  getContact: param => {
    return rp(getRequestOpt.contactOpt(param))
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
        return rp(getRequestOpt.batchContactOpt(param, groupList))
          .then(res => {
            if (!res) return;
            return memberList.concat(res.ContactList);
          });
      });
  },
  getMsg: param => {
    return rp(getRequestOpt.getMsgOpt(param))
      .then(res => {
        return res;
      });
  },
  getMsgMedia: (msg, type) => {
    switch (type) {
      case 'image':
        return rp(getMsgImgOpt())
        break;
      case 'video':

        break;
      case 'file':

        break;
      default:
        break;
    }
  },

  logout: param => {
    return rp(getRequestOpt.logoutOpt(param))
      .then(res => {
        return true
      });
  },
  sendMsg: (data, msg) => {
    return rp(getRequestOpt.sendMsgOpt(data, msg))
      .then(res => {
        return res;
      });
  }
}
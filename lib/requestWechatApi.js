/*
 * @Author: Liu Jing 
 * @Date: 2017-12-04 15:39:13 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-05 23:04:41
 */
const xml2json = require('./decodeXML2JSON');
const getRequestOpt = require('./getAPIRequestOption');
//const FileCookieStore = require('tough-cookie-file-store');
const requestPromise = require('request-promise');
//const saveCookie = require('./saveCookie');
const path = require('path');
//const jsonfile = require('jsonfile');
//var jar = requestPromise.jar(new FileCookieStore(path.resolve(__dirname, '../cookie.json')));
const rp = requestPromise.defaults({
  jar: true,
  simple: true
});
const api = {
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
          uri: getRequestOpt.QRcodeOpt(uuid).uri
        }
      })
  },
  QRcodeScanResult: uuid => {
    return rp(getRequestOpt.QRcodeScanResult(uuid, 1))
      .then(res => {
        let window = {}
        if (res) {
          eval(res);
        }
        return window;
      })
  },
  getRedirectURL: url => {
    return rp(getRequestOpt.redicetURLOpt(url))
      .then(res => {
        //saveCookie(res);
        //jar = requestPromise.jar(new FileCookieStore(path.resolve(__dirname, '../cookie.json')));
        let info = xml2json(res);
        if (!info) return;
        info = info.error;
        return {
          skey: info.skey,
          sid: info.wxsid,
          uin: info.wxuin,
          pass_ticket: info.pass_ticket
        }
      })
  },
  initWebWX: info => {
   return rp(getRequestOpt.initWebWXOpt(info)).then(res => {
      return res;
    });
  },
  login: async progress => {
    // 如果已经登录，则直接初始化

    // 如果可以不扫描二维码直接等待登录结果

    // 获取二维码,扫描, 登录
    // 第一步，获取二维码
    if (!progress) {
      let {
        uuid,
        uri
      } = await api.getQRcode();
      return {
        uuid,
        uri,
        step: 'qr'
      }
    }
    // 第二步，获取扫码结果
    if (progress.step === 'qr' || progress.step === 'waiting') {
      let res = await api.QRcodeScanResult(progress.uuid);
      if (res.code == 201) {
        return {
          uuid: progress.uuid,
          step: 'waiting'
        }
      }
      if (res.code == 200) {
        let info = await api.getRedirectURL(res.redirect_uri);
        if (!info) return;
        let initData = await api.initWebWX(info);
        Object.assign(info, initData);
        info.step = 'success';
        return info;
      }
    }
    /* if (redirect_uri) {
    } else {
      //如果已经登录，则直接初始化
      let cookie = jsonfile.readFileSync('../cookie.json');
      let data = cookie['wx.qq.com']['/'];
      let uin = 'xuin=' + data['wxuin']['value'];
      let sid = data['wxsid']['value'];

      let info = {
        skey: info.skey,
        sid: info.wxsid,
        uin: info.wxuin,
        pass_ticket: info.pass_ticket,
        isgrarscale: info.isgrayscale
      }
      return rp(getRequestOpt.initWebWXOpt(info)).then(res => {
        Object.assign(info, res);
        return info;
      });
    } */

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
        //saveCookie(res);
        //jar = requestPromise.jar(new FileCookieStore(path.resolve(__dirname, '../cookie.json')));
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
module.exports = api
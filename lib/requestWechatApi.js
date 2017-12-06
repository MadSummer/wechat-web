/*
 * @Author: Liu Jing 
 * @Date: 2017-12-04 15:39:13 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-06 13:54:16
 */
const xml2json = require('./decodeXML2JSON');
const getRequestOpt = require('./getAPIRequestOption');
const requestPromise = require('request-promise');
const { isCookieExpires, updateCookieJSON, getCookiesStore } = require('./cookieTools');
/**
 * save cookie to json file and update request's jar
 * @param {Response} response - Response
 */
const updateRequestCookie = response => {
  updateCookieJSON(response);
  jar = requestPromise.jar(getCookiesStore());
}
let jar;
updateRequestCookie();
const rp = requestPromise.defaults({
  jar: jar,
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
  pushLogin: uin => {
    return rp(getRequestOpt.pushLogin(uin)).then(res => {
      //{"ret":"3","msg":"device authinfo invalid"}
      res = JSON.parse(res);
      if (res.ret == 0) return res.uuid;
    });
  },
  getRedirectURL: url => {
    return rp(getRequestOpt.redicetURLOpt(url))
      .then(res => {
        updateRequestCookie(res);
        let info = xml2json(res.body);
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
    // 获取cookie
    let cookiesStore = getCookiesStore();
    let uin;
    if (cookiesStore) {
      uin = cookiesStore.idx['wx.qq.com']['/']['wxuin']['value']
    }
    // 如果已经登录，则直接初始化

    //开始登录
    // 第一步，直接登录，或者扫码
    if (!progress) {
      // 如果本地可以直接登录，则不需要扫码
      // 判断一句为最后一次登录是否为此程序保存的cookie
      let uuid = await api.pushLogin(uin);
      if (uuid) {
        return { uuid, step: 'waiting' };
      } else {
        // 否则需要拉取二维码扫码登录
        let { uuid, uri } = await api.getQRcode();
        return { uuid, uri, step: 'qr' }
      }
    }
    // 第二步，获取扫码结果
    if (progress.step === 'qr' || progress.step === 'waiting') {
      let res = await api.QRcodeScanResult(progress.uuid);
      if (res.code == 201) return { uuid: progress.uuid, step: 'waiting' }
      if (res.code == 200) {
        let info = await api.getRedirectURL(res.redirect_uri);
        if (!info) return;
        let initData = await api.initWebWX(info);
        Object.assign(info, initData);
        info.step = 'success';
        return info;
      }
    }
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
module.exports = {
  url: {
    getUUID: () => {
      return {
        uri: 'https://login.wx.qq.com/jslogin',
        qs: {
          appid: 'wx782c26e4c19acffb',
          fun: 'new',
          lang: 'zh_CN',
          _: () => +new Date()
        }
      }
    },
    getQR: uuid => {
      return {
        uri: 'https://login.weixin.qq.com/l/' + uuid,
      }
    },
    login: (uuid, tip) => {
      return {
        uri: 'https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login',
        qs: {
          loginicon: true,
          uuid: uuid,
          tip: tip,
          _: () => +new Date()
        }
      }
    },
    getRedicetURL: redirect_uri => {
      return {
        uri: redirect_uri + '&fun=new&version=2'
      }
    },
    initWebWX: param => {
      return {
        method: 'POST',
        uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=659125059&lang=zh_CN&pass_ticket=T23jnPGrJlqNIIVszEz1VG9h1d%252B9YbrnxXTleoqaEIA%253D',
        qs: {
          lang: 'zh_CN',
          pass_ticket: param.pass_ticket,
          r:() => ~new Date()
        },
        json: {
          BaseRequest: {
            Uin: param.uin,
            Sid: param.sid,
            Skey: param.skey
          },
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
          Sid: param.sid,
          Skey: param.skey,
          Uin: param.uin,
        },
      };
    },
    getContact: param => {
      return {
        uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact',
        qs: {
          lang: 'zh_CN',
          pass_ticket: param.pass_ticket,
          r: () => +new Date(),
          seq: 0,
          skey: param.skey,
        }
      }
    },
    checkMsg: param => {
      let synckey = [];
      param.SyncCheckKey.List.forEach(list => {
        let key = list.Key;
        let val = list.Val;
        synckey.push(key + '_' + val);
      });
      return {
        uri: 'https://webpush.wx.qq.com/cgi-bin/mmwebwx-bin/synccheck',
        qs: {
          r: () => +new Date(),
          _: () => +new Date(),
          skey: param.skey,
          sid: param.sid,
          uin: param.uin,
          synckey: synckey.join('|')
        }
      }
    },
    getMsg: param => {
      return {
        method:'POST',
        uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsync',
        qs: {
          sid: param.sid,
          skey: param.skey,
          lang: 'zh_CN',
          pass_ticket: param.pass_ticket
        },
        json: {
          BaseRequest: {
            Uin: param.uin,
            Sid: param.sid,
            Skey: param.skey,
            DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
          },
          SyncKey: param.SyncKey,
          rr:() => ~new Date()
        },
      }
    },
    sendMsg: (data, param) => {
      let now = +new Date();
      let id = now + 6546;
      return {
        method:'POST',
        uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg',
        qs: {
          lang: 'zh_CN',
          pass_ticket:data.pass_ticket
        },
        json: {
          BaseRequest: {
            Uin: data.uin,
            Sid: data.sid,
            Skey: data.skey,
            DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
          },
          Msg: {
            Type:1,
            ClientMsgId: id,
            Content: param.content,
            FromUserName: param.FromUserName,
            LocalID: id,
            ToUserName:param.ToUserName
          },
          Sence:0
        }
      }
    },
    logout: param => {
      return {
        method:'POST',
        uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxlogout',
        qs: {
          redirect: 1,
          type: 0,
          skey:param.skey
        },
        form: {
          sid: param.sid,
          uin:param.uin
        }
      }
    }
  }
}
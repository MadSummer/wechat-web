module.exports = {
  url: {
    getUUID: () => {
      return {
        uri: 'https://login.wx.qq.com/jslogin',
        qs: {
          appid: 'wx782c26e4c19acffb',
          fun: 'new',
          lang: 'zh_CN',
          _: +new Date()
        }
      }
    },
    getQR: uuid => {
      return {
        uri: 'https://login.weixin.qq.com/qrcode/' + uuid,
      }
    },
    login: (uuid, tip) => {
      return {
        uri: 'https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login',
        qs: {
          loginicon: true,
          uuid: uuid,
          tip: tip,
          _: +new Date()
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
          pass_ticket: param.pass_ticket
        },
        json: {
          BaseRequest: {
            Uin: param.wxuin,
            Sid: param.wxsid,
            Skey: param.skey
          },
          DeviceID: 'e441590048076577',
          Sid: param.wxsid,
          Skey: param.skey,
          Uin: param.wxuin,
        },
      };
    },
    getContact: param => {
      return {
        uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact',
        qs: {
          lang: 'zh_CN',
          pass_ticket: param.pass_ticket,
          r: +new Date(),
          seq: 0,
          skey: param.skey,
        }
      }
    }
  }
}
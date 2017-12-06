/*
 * @Author: Liu Jing 
 * @Date: 2017-12-04 16:04:41 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-06 18:47:35
 */
const config = require('../config');
module.exports = {
  uuidOpt: () => {
    let _ = +new Date();
    return {
      uri: 'https://login.wx.qq.com/jslogin',
      qs: {
        appid: 'wx782c26e4c19acffb', // 微信网页版
        fun: 'new',
        lang: 'zh_CN',
        _: _
      }
    }
  },
  pushLogin: uin => {
    return {
      headers: {
        'Cookie':'last_wxuin=178051200; login_frequency=3; MM_WX_NOTIFY_STATE=1; MM_WX_SOUND_STATE=1; wxpluginkey=1512554282; wxuin=178051200; wxsid=HI0pCVJFGHik9n59; wxloadtime=1512556141; mm_lang=zh_CN; webwxuvid=3f90b71608b427cafb9cbb6790392982c524d99c58218910f5fedd1a646831fd4c7269ed27ae346953f4762dd39503c8; webwx_auth_ticket=CIsBEOC0qI0IGoABIbIMWiXP2us40grt8v7D0TnCWstkTwEGbzwQClH9MvmxAJWLjiPBx7tbadSEJT7UtZyeeiMNo0tWWvOj44sY+vHQvM5aKCIEXkVE27ZaOIldo+OfJm6D/zfeDELMxKVcZmF4346/hD1JjpxWid6Q1Nct4MxV1C5m6Me0NoddyVg=; webwx_data_ticket=gSeXPoYUagSSSdaE1YZQUz1J'
      },
      resolveWithFullResponse: true,
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxpushloginurl',
      qs: {
        uin: uin
      }
    }
  },
  QRcodeOpt: uuid => {
    return {
      uri: 'https://login.weixin.qq.com/l/' + uuid
    }
  },
  QRcodeScanResult: (uuid, tip) => {
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
  redicetURLOpt: redirect_uri => {
    return {
      uri: redirect_uri + '&fun=new&version=v2',
      resolveWithFullResponse: true
    }
  },
  initWebWXOpt: param => {
    return {
      headers: {
        'Connection': ':keep-alive'
      },
      resolveWithFullResponse: true,
      method: 'POST',
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit',
      qs: {
        lang: 'zh_CN',
        pass_ticket: param.pass_ticket,
        r: () => ~new Date()
      },
      json: {
        BaseRequest: {
          Uin: param.uin,
          Sid: param.sid,
          Skey: param.skey,
          DeviceID: config.DeviceID
        },
        DeviceID: config.DeviceID,
        Sid: param.sid,
        Skey: param.skey,
        Uin: param.uin,
      },
    };
  },
  contactOpt: param => {
    let r = +new Date();
    return {
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact',
      qs: {
        lang: 'zh_CN',
        pass_ticket: param.pass_ticket,
        r: r,
        seq: 0,
        skey: param.skey,
      }
    }
  },
  batchContactOpt: (param, list) => {
    let r = +new Date()
    return {
      method: 'POST',
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxbatchgetcontact',
      qs: {
        type: 'ex',
        r: r,
        pass_ticket: param.pass_ticket
      },
      json: {
        BaseRequest: {
          Uin: param.uin,
          Sid: param.sid,
          Skey: param.skey,
          DeviceID: config.DeviceID,
        },
        Count: list.length,
        List: list
      }
    }
  },
  checkMsgOpt: param => {
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
  getMsgOpt: param => {
    return {
      resolveWithFullResponse: true,
      method: 'POST',
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
          DeviceID: config.DeviceID,
        },
        SyncKey: param.SyncKey,
        rr: () => ~new Date()
      },
    }
  },
  getMsgImgOpt: (param, MsgID) => {
    return {
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetmsgimg',
      qs: {
        MsgID: MsgID,
        skey: param.skey
        //type:'slave' //缩略图
      }
    }
  },
  getMsgVideoOpt: (param, MsgID) => {
    return {
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetmsgimg',
      qs: {
        MsgID: MsgID,
        skey: param.skey
        //type:'slave' //缩略图
      }
    }
  },
  getMsgFileOpt: (param, MsgID) => {
    return {
      uri: 'https://file.wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetmedia',
      qs: {
        sender: '', //非必填
        mediaid: '',
        filename: '',
        fromuser: '',//非必填
        pass_ticket: param.pass_ticket,//非必填
        webwx_data_ticket: '',//非必填
      }
    }
  },
  sendMsgOpt: (param, msg) => {
    let now = +new Date();
    let id = now + 6546;
    return {
      method: 'POST',
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg',
      qs: {
        lang: 'zh_CN',
        pass_ticket: param.pass_ticket
      },
      json: {
        BaseRequest: {
          Uin: param.uin,
          Sid: param.sid,
          Skey: param.skey,
          DeviceID: config.DeviceID,
        },
        Msg: {
          Type: 1,
          ClientMsgId: id,
          Content: msg.Content,
          FromUserName: msg.FromUserName,
          LocalID: id,
          ToUserName: msg.ToUserName
        },
        Sence: 0
      }
    }
  },
  revokeMsgOpt: (param) => {
    return {
      method: 'POST',
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxrevokemsg',
      qs: {
        lang: 'zh_CN',
        pass_ticket: param.pass_ticket
      },
      json: {
        BaseRequest: {
          Uin: param.uin,
          Sid: param.sid,
          Skey: param.skey,
          DeviceID: config.DeviceID,
        },
        ClientMsgId: 1,
        SvrMsgId: id,
        ToUserName: msg.ToUserName
      }
    }
  },
  logoutOpt: param => {
    return {
      method: 'POST',
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxlogout',
      qs: {
        redirect: 1,
        type: 0,
        skey: param.skey
      },
      form: {
        sid: param.sid,
        uin: param.uin
      }
    }
  }
}
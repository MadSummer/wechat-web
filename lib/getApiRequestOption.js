/*
 * @Author: Liu Jing 
 * @Date: 2017-12-04 16:04:41 
 * @Last Modified by: Liu Jing
 * @Last Modified time: 2017-12-04 16:07:33
 */

module.exports = {
  uuidOpt: () => {
    let _ = +new Date();
    return {
      uri: 'https://login.wx.qq.com/jslogin',
      qs: {
        appid: 'wx782c26e4c19acffb',
        fun: 'new',
        lang: 'zh_CN',
        _: _
      }
    }
  },
  QRcodeOpt: uuid => {
    return {
      uri: 'https://login.weixin.qq.com/l/' + uuid,
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
      uri: redirect_uri + '&fun=new&version=2'
    }
  },
  initWebWXOpt: param => {
    return {
      method: 'POST',
      uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=659125059&lang=zh_CN&pass_ticket=T23jnPGrJlqNIIVszEz1VG9h1d%252B9YbrnxXTleoqaEIA%253D',
      qs: {
        lang: 'zh_CN',
        pass_ticket: param.pass_ticket,
        r: () => ~new Date()
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
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
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
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
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
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
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
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
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
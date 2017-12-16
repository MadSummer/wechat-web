const tokenURL = 'https://openapi.baidu.com/oauth/2.0/token ';
const rp = require('request-promise');
const fse = require('fs-extra');
const pcm = require('pcm-util');
const baiduASR = {
  getTokenFromServer: () => {
    return rp({
      method: 'POST',
      uri: 'https://openapi.baidu.com/oauth/2.0/token',
      qs: {
        grant_type: 'client_credentials',
        client_id: 'Vqxtkidm7xk1b5bRewCY8ly4',
        client_secret: '3bed3a696f6477c33310ffd67d707bd8'
      }
    }).then(res => {
      let data = JSON.parse(res);
      data.create_time = +new Date();
      fse.writeJSONSync('./token.json', data);
      return data;
    });
  },
  getToken: async () => {
    let token = fse.readJSONSync('./token.json', {
      throws: false
    });
    if (!token) {
      token = await baiduASR.getTokenFromServer();
    } else {
      // token.expires_in => second
      let isExpires = +new Date() - token.create_time > token.expires_in;
      if (isExpires) {
        token = await baiduASR.getTokenFromServer();
      }
    }

    return token.access_token;
  },
  transToPcm: (filepath) => {
    let arr = filepath.split('.');
    let suffix = arr[arr.length - 1];
    if (suffix != 'pcm' && suffix != 'wav') {
      let voice = fse.readFileSync(filepath);
      pcm.defaults = {
        channels: 1,
        sampleRate: 16000,
        interleaved: true,
        float: false,
        signed: true,
        bitDepth: 16,
        byteOrder: 'LE',
        max: 32767,
        min: -32768,
        samplesPerFrame: 1024,
        id: 'S_16_LE_2_44100_I'
      }
      let buf = pcm.format(voice, {
        channels: 1,
        sampleRate: 16000,
      });
      console.log(pcm.toArrayBuffer(buf));
      return 
    }
  },
  asr: async filepath => {
    filepath = './16k.pcm';
    let access_token = await baiduASR.getToken();
    let voice = fse.readFileSync(filepath);
    let length = voice.byteLength;
    return rp({
      method: 'POST',
      uri: 'http://vop.baidu.com/server_api',
      json: {
        'format': 'wav',
        'rate': 16000,
        'channel': 1,
        'token': access_token,
        'cuid': 'baidu_workshop111',
        'len': length,
        'speech': voice.toString('base64')
      }
    }).then(res => {
      return res;
    })
  }
}
module.exports = baiduASR;
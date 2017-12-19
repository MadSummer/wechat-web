const AipSpeechClient = require('baidu-ai').speech;
const APP_ID = '10522749';
const API_KEY = 'Vqxtkidm7xk1b5bRewCY8ly4';
const SECRET_KEY = '3bed3a696f6477c33310ffd67d707bd8';
const client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY);
const fse = require('fs-extra');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const baiduASR = {
  transToPcm: filepath => {
    return new Promise((onFullFilled, onRejected) => {
      let parsedPath = path.parse(filepath);
      let newFilePath = parsedPath.dir + `/${parsedPath.name}_t.pcm`;
      if (parsedPath.ext !== '.pcm') {
        if (fse.existsSync(newFilePath)) {
          onFullFilled(fse.readFileSync(newFilePath));
        } else {
          ffmpeg(filepath)
            .toFormat('s16le')// to pcm  
            .audioCodec('pcm_s16le') // audiocodec
            .audioChannels(1) // 频道
            .audioFrequency(16000) //频率
            .on('error', function (err) {
              onFullFilled();
            })
            .on('progress', function (progress) {

            })
            .on('end', function () {
              onFullFilled(fse.readFileSync(newFilePath));
            })
            .save(newFilePath);
        }
      } else {
        onFullFilled(fse.readFileSync(filepath));
      }
    });
  },
  recognize: async filepath => {
    let voice = await baiduASR.transToPcm(filepath)
    return client.recognize(voice, 'pcm', 16000)
  }
}
module.exports = baiduASR;
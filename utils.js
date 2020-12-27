const { Readable } = require('stream');
const {
  FFMPEGPath,
  FFMPEGProbePath
} = require('./config.js');

const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(FFMPEGPath);
ffmpeg.setFfprobePath(FFMPEGProbePath);

class Silence extends Readable {
  _read () {
    this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
  }
}

/**
 * Process audio chunks
 * @param {Buffer[]} c Chunks array
 */
const processAudio = (c) => {
  const buf = Buffer.concat(c);
  const source = Readable.from(buf);
  const f = ffmpeg({
    source
  })
    .inputFormat('s32le')
    .audioBitrate(128e3)
    .audioChannels(2)
    .complexFilter('asetrate=48000*2^(1.09/12),atempo=0.1+(1/2^(1.09/12))')
    .audioCodec('libmp3lame')
    .format('mp3')
    .on('error', console.error)
    .pipe();
  return f;
};

module.exports = {
  Silence,
  Readable,
  processAudio
};

const { Readable, PassThrough, Writable } = require('stream');
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

class Dumper extends Writable {
  constructor () {
    super({
      highWaterMark: 1 << 16
    });
  }

  _write (c, e, callback) {
    callback();
  }
}

/**
 * Process audio chunks
 * @param {Readable} s Input stream
 */
const processAudioStream = (s, format = 'adts', codec = 'aac') => {
  const f = ffmpeg({
    source: s
  })
    .inputFormat('s32le')
    .audioBitrate(128e3)
    .audioChannels(2)
    .complexFilter('asetrate=48000*2^(1.09/12),atempo=0.035+(1/2^(1.043/12))')
    .audioCodec(codec)
    .format(format)
    .on('error', (e) => e.message.includes('stream closed') ? null : console.error(e))
    .pipe();
  return largerStream(f);
};

/**
 * Process audio chunks
 * @param {Buffer[]} c Chunks array
 */
const processAudio = (c) => {
  const buf = Buffer.concat(c);
  const source = Readable.from(buf);
  return processAudioStream(source);
};

/**
 * Create PassThrough stream with larger highWaterMark
 * @param {Readable} s Readable stream
 */
const largerStream = (s) => {
  const st = new PassThrough({
    highWaterMark: 1 << 16,
    readableHighWaterMark: 1 << 16,
    writableHighWaterMark: 1 << 16
  });
  s.pipe(st);
  return st;
};

module.exports = {
  Silence,
  Readable,
  PassThrough,
  processAudio,
  processAudioStream,
  Dumper,
  largerStream
};

const { Readable, Writable, PassThrough } = require('stream');
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

const highWaterMark = 1 << 26;
const readableHighWaterMark = 1 << 26;
const writableHighWaterMark = 1 << 26;

class Dumper extends Writable {
  constructor () {
    super({
      highWaterMark
    });
  }

  _write (_, __, cb) {
    cb();
  }
}

// const generateSilence = require('pcm-silence').generateSilence;

/**
 * Process audio stream
 * @param {Readable} s Input stream
 * @param {string} [format="adts"] Output format
 * @param {string} [codec="aac"] Audio codec
 * @param {string} [inf="s32le"] Input format
 * @param {string} [video="libvpx"] Video codec (For WebM)
 * @param {string} image Still image path for video placeholder
 */
const processAudioStream = (s, format = 'adts', codec = 'aac', inf = 's32le') => {
  const f = ffmpeg({
    source: s
  }).inputFormat(inf);

  if (format === 'mp3') f.addOption(['-q:a 2']);
  else f.audioBitrate(128e3);

  f.audioChannels(2)
    .complexFilter('asetrate=48000*2^(1.065/12),atempo=(1/2^(1.014/12))')
    .audioCodec(codec)
    .format(format)
    .on('error', (e) => e.message.includes('stream closed') ? null : console.error(e));
  return f.pipe();
};

/**
 * Copy Readable stream to pass through
 * @param {Readable} s Input stream
 */
const copyStream = (s) => {
  const p = new PassThrough({
    highWaterMark,
    readableHighWaterMark,
    writableHighWaterMark
  });
  s.pipe(p);
  return p;
};

/**
 * Sleep/delay function
 * @param {number} ms Timeout
 */
const sleep = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  sleep,
  copyStream,
  Silence,
  Readable,
  processAudioStream,
  Dumper,
  highWaterMark,
  readableHighWaterMark,
  writableHighWaterMark
};

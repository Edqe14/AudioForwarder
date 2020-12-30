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

  _write (c, e, cb) {
    cb();
  }
}

// const generateSilence = require('pcm-silence').generateSilence;

/**
 * Process audio stream
 * @param {Readable} s Input stream
 */
const processAudioStream = (s, format = 'adts', codec = 'aac', inf = 's32le') => {
  const f = ffmpeg({
    source: s
  })
    .inputFormat(inf)
    .audioBitrate(128e3)
    .audioChannels(2)
    .complexFilter('asetrate=48000*2^(1.075/12),atempo=(1/2^(1.015/12))')
    .audioCodec(codec)
    .format(format)
    .on('error', (e) => e.message.includes('stream closed') ? null : console.error(e))
    .pipe();
  return f;
};

/* eslint-disable */
/**
 * Process multiple audio streams using url
 * `ffmpeg -chunked_post 1 -f s32le -i http://localhost:8080/raw?id=234395307759108106 -b:a 128K -ac 2 -c:a aac -f adts out.adts`
 * @param {string[]} ss Input stream url
 */
/* eslint-enable */

/*
const processAudioStreams = (ss, format = 'adts', codec = 'aac') => {
  let options = [
    '-chunked_post 1',
    '-f s32le'
  ];
  ss.forEach(u => options.push(`-i ${u}`));
  options = [
    ...options,
    `-filter_complex "amix=inputs=${ss.length}:duration=longest,asetrate=48000*2^(1.09/12),atempo=0.017+(1/2^(1.045/12))"`,
    '-b:a 128K',
    '-ac 2',
    `-c:a ${codec}`,
    `-f ${format}`
  ];
  const f = ffmpeg()
    .addOptions(options)
    .on('error', (e) => e.message.includes('stream closed') ? null : console.error(e));
  return f.pipe();
};
*/

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

import { Readable, Writable, PassThrough } from 'stream';
import Config from './Config';
const { FFMPEGPath } = Config;

import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(FFMPEGPath);

export const highWaterMark = 1 << 26;
export const readableHighWaterMark = 1 << 26;
export const writableHighWaterMark = 1 << 26;

export class Silence extends Readable {
  _read () {
    this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
  }
}

export class Dumper extends Writable {
  constructor () {
    super({
      highWaterMark
    });
  }

  _write (_: any, __: any, cb: Function) {
    cb();
  }
}

export const processAudioStream = (s: PassThrough | Readable, format = 'adts', codec = 'aac', inf = 's32le') => {
  const f = ffmpeg({
    source: s
  }).inputFormat(inf);

  if (format === 'mp3') f.addOption(['-q:a 2']);
  else f.audioBitrate(128e3);

  f.audioChannels(2)
    .complexFilter('asetrate=48000*2^(1.065/12),atempo=(1/2^(1.014/12))')
    .audioCodec(codec)
    .format(format)
    .on('error', (e) => console.error(e));
  return f.pipe();
}

export const copyStream = (s: Readable | PassThrough) => {
  const p = new PassThrough({
    highWaterMark,
    readableHighWaterMark,
    writableHighWaterMark
  });
  s.pipe(p);
  return p;
};

export const sleep = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

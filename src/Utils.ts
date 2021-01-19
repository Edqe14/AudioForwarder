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
      highWaterMark: 1 << 16
    });
  }

  _write (_: any, __: any, cb: Function) {
    cb();
  }
}

export const processAudioStream = (s: PassThrough | Readable, format = 'adts', codec = 'aac', inf = 's32le', rate = 48000) => {
  const options = [
    format === 'mp3' ? '-q:a 2' : '-b:a 128K',
    '-ac 2',
    '-vn',
    `-c:a ${codec}`,
    `-f ${format}`,
    `-ar ${rate}`,
  ];
  if (format === 'webm') options.splice(1, 0, '-dash 1');

  const f = ffmpeg().addInput(s).inputFormat(inf).addOptions(options).complexFilter(`asetrate=${rate}*2^(1.063/12),atempo=(1/2^(1.015/12))`);
  f.on('error', (e) => console.error(e));
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

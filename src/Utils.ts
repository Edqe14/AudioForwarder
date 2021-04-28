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
    '-ac 2'
  ];
  if (format === 'webm') options.splice(1, 0, '-dash 1');

  const f = ffmpeg()
    .addInput(s)
    .inputFormat(inf)
    .addInput('anullsrc=channel_layout=stereo:sample_rate=44100')
    .inputFormat('lavfi')
    .addOptions(options)
    .complexFilter(`asetrate=${rate}*2^(1.063/12),atempo=(1/2^(1.014/12)),amerge=inputs=2`);
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

export const webmHeader = () => {
  return Buffer.from('1A45DFA39F4286810142F7810142F2810442F381084282847765626D42878104428581021853806701FFFFFFFFFFFFFF114D9B74AB4DBB8B53AB841549A96653AC81A14DBB8B53AB841654AE6B53AC81CD4DBB8C53AB841254C36753AC820134EC010000000000006800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001549A966A72AD7B1830F42404D808D4C61766635382E36352E31303057418D4C61766635382E36352E3130301654AE6BE2AE0100000000000059D7810173C588A661FB142FACB8389C810022B59C83756E648686415F4F50555356AA83632EA056BB8404C4B400838102E1919F8102B58840E77000000000006264812063A2934F707573486561640102380180BB00000000001254C367F67373010000000000002763C08067C8010000000000001A45A387454E434F44455244878D4C61766635382E36352E3130307373010000000000003B63C08B63C588A661FB142FACB83867C8010000000000002345A387454E434F4445524487964C61766335382E3131352E313032206C69626F7075731F43B67573A5E78100A3420B81000080FC795C2F7AA7D12097956FBC0F8E2ACFA6', 'hex');
}

export const oggHeader = () => {
  return Buffer.from('4F676753000200000000000000002CB46C8A00000000749EAF9101', 'hex');
}

export const wavHeader = () => {
  return Buffer.from('52494646FFFFFFFF57415645666D7420100000000100020080BB000000EE0200040010004C4953541A000000494E464F495346540E0000004C61766635382E36352E3130300064617461FFFFFFFF', 'hex');
}

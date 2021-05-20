import { Readable } from 'stream';

export default class Silence extends Readable {
  _read(): void {
    this.push(Buffer.from([0xf8, 0xff, 0xfe]));
  }
}

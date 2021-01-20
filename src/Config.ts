import { join } from 'path';
import { Collection } from 'discord.js-light';

export interface Config {
  guildID: string;
  channelID: string;
  userIDs: Collection<string, number>;
  listenAll: boolean;
  FFMPEGPath: string;
}

export default {
  guildID: '669141768515878932',
  channelID: '793321187761455165',
  userIDs: new Collection([
    ['234395307759108106', 25],
    ['326966683187281922', 100]
  ]),
  listenAll: true,
  FFMPEGPath: join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe')
};

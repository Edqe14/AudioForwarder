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
  guildID: '563000739480207360',
  channelID: '721254117284249610',
  userIDs: new Collection([
    ['234395307759108106', 25],
    ['326966683187281922', 100]
  ]),
  listenAll: true,
  FFMPEGPath: join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe')
};

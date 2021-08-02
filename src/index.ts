import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
  path: path.join(__dirname, '.env'),
});

import Bot from './bot';
import Config from './config';
import Server from './server';
import Logger from './utils/logger';
import { Mixer } from 'audio-mixer';
import {
  createAudioPlayer,
  createAudioResource,
  StreamType,
  VoiceConnection,
} from '@discordjs/voice';
import { FfmpegCommand } from 'fluent-ffmpeg';

import InteractionHandler from './handlers/interaction';
import MessageHandler from './handlers/message';
import Silence from '@utils/silence';
// import VoiceStateUpdateHandler from './handlers/voiceStateUpdate.ts.a';

const bot = Bot(Logger);
if (Config.useServer) Server(Logger);

const silencePlayer = createAudioPlayer();
silencePlayer.play(
  createAudioResource(new Silence(), {
    inputType: StreamType.Opus,
  })
);

const channels: Map<string, string> = new Map();
// eslint-disable-next-line prettier/prettier
const mixers: Map<
  string,
  { mixer: Mixer; connection: VoiceConnection; transcoder: FfmpegCommand }
> = new Map();

bot
  .on(
    'interactionCreate',
    InteractionHandler.bind(this, channels, mixers, Logger)
  )
  .on('messageCreate', MessageHandler);
// bot.on(
//   'voiceStateUpdate',
//   VoiceStateUpdateHandler.bind(this, channels, mixers, Logger)
// );

export default {
  channels,
  mixers,
  silencePlayer,
};

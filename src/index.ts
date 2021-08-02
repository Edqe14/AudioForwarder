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
import { VoiceConnection } from 'discord.js';
import { FfmpegCommand } from 'fluent-ffmpeg';

import MessageHandler from './handlers/message';
import VoiceStateUpdateHandler from './handlers/voiceStateUpdate';

const bot = Bot(Logger);
if (Config.useServer) Server(Logger);

const channels: Map<string, string> = new Map();
// eslint-disable-next-line prettier/prettier
const mixers: Map<
  string,
  { mixer: Mixer; connection: VoiceConnection; transcoder: FfmpegCommand }
> = new Map();

bot.on('message', MessageHandler.bind(this, channels, mixers, Logger));
bot.on(
  'voiceStateUpdate',
  VoiceStateUpdateHandler.bind(this, channels, mixers, Logger)
);

export default {
  channels,
  mixers,
};

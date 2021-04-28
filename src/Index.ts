import { join } from 'path';
import { config } from 'dotenv';
config({
  path: join(__dirname, '.env')
});

import { logger } from './Logger';
import Config from './Config';
const { guildID, channelID, userIDs, listenAll } = Config;

import { Client, User, VoiceChannel, VoiceConnection, Collection } from 'discord.js-light';
import { Mixer, Input } from 'audio-mixer';
import { PassThrough } from 'stream'
import {
  sleep,
  Silence,
  processAudioStream,
  Dumper,
  highWaterMark,
} from './Utils';

export const client = new Client({
  cacheGuilds: true,
  cacheChannels: false,
  cacheOverwrites: false,
  cacheRoles: false,
  cacheEmojis: false,
  cachePresences: false,
  fetchAllMembers: true,
  ws: {
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES']
  }
});
logger.info('Created client');
client.on('error', logger.error);

let streams: Collection<string, {
  piped: boolean,
  stream?: import('stream').Readable,
  input?: Input
}> = new Collection();

if (listenAll) {
  logger.info('"listenAll" is true, removing "streams" object...');
  streams = null;
} else {
  logger.info('"listenAll" is false, setting all user ids...')
  userIDs.keyArray().forEach((id) => {
    streams.set(id, {
      piped: false,
      stream: null,
      input: null
    });
  });
}

const transcoders: Collection<string, import('stream').PassThrough> = new Collection();
const mixer = new Mixer({
  highWaterMark,
  channels: 2,
  bitDepth: 32,
  sampleRate: 48000
});
logger.info('Created Mixer');

import Server from './Server';

let connection: VoiceConnection;
client.on('ready', async () => {
  logger.info(`Bot logged in as ${client.user.tag}`);
  
  const guild = await client.guilds.fetch(guildID);
  if (!guild) return;
  
  const channel = (await guild.channels.fetch(channelID)) as VoiceChannel;
  if (!channel) return;
  if (channel.type !== 'voice') throw new Error('Channel is not voice channel!');
  
  const voiceState = guild.voice;
  if (!voiceState || (voiceState && !voiceState.connection)) {
    if (!channel.joinable) throw new Error('Cannot joint the voice channel');
    connection = await channel.join();
    logger.info('Joined the voice channel');
  } else connection = voiceState.connection;
  
  // SERVER
  Server(streams, transcoders, mixer);

  connection.play(new Silence(), { type: 'opus' });

  let removingSpeaking = false;
  const speakingHandler = async (user: User) => {
    if (listenAll) {
      const r = connection.receiver.createStream(user, {
        mode: 'pcm',
        end: 'silence'
      });

      const input = mixer.input({
        highWaterMark,
        clearInterval: 250,
        volume: userIDs.get(user.id) || 100
      });

      r.pipe(input);
      r.on('end', () => {
        mixer.removeInput(input);
        r.removeAllListeners();
      });
      return;
    }

    if (!streams.has(user.id)) return;
    if (!streams.some(s => !s.piped)) {
      if (removingSpeaking) return;
      removingSpeaking = true;

      logger.info('Removing "speaking" listener...');
      connection.removeListener('speaking', speakingHandler);
      return;
    }

    const u = streams.get(user.id);
    if (u.piped) return;

    logger.info(`${user.tag} is speaking. Creating receiver...`);

    const input = u.input = mixer.input({
      highWaterMark,
      volume: userIDs.get(user.id)
    });
    const r = u.stream = connection.receiver.createStream(user, {
      mode: 'pcm',
      end: 'manual'
    });

    r.pipe(input);
    u.piped = true;
    return;
  }

  connection.on('speaking', speakingHandler);

  logger.info('Waiting 2 seconds to load receivers...');
  await sleep(2000);
  logger.info('Loading transcoders...');

  transcoders.set('aac', processAudioStream(mixer) as PassThrough);
  transcoders.set('mp3', processAudioStream(mixer, 'mp3', 'libmp3lame') as PassThrough);
  transcoders.set('webm', processAudioStream(mixer, 'webm', 'libopus') as PassThrough);
  transcoders.set('wav', processAudioStream(mixer, 'wav', 'pcm_s16le') as PassThrough);
  transcoders.set('ogg', processAudioStream(mixer, 'ogg', 'libvorbis') as PassThrough);
  logger.info(`Transcoding to "${transcoders.keyArray().join(', ')}" format(s)`);

  // Prevent overloading
  transcoders.forEach(s => s.pipe(new Dumper()));
});

let exiting = false;
process.on('exit', () => {
  if (exiting) return;

  exiting = true;
  logger.info('Exiting...');
  if (connection && connection.voice && connection.voice.channel) connection.voice.channel.leave();
  process.exit(1);
});
process.on('SIGINT', () => process.emit('exit', 1));

client.login(process.env.TOKEN)
  .then(() => logger.info('Client logged in'))
  .catch((e) => logger.error('Failed to login | ' + e.message));

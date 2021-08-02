import { VoiceConnection } from 'discord.js';
import { Logger } from 'winston';
import { Mixer } from 'audio-mixer';
import fs from 'fs';
import path from 'path';
import Config from '../config';

import HealSelf from '@utils/healSelf';
import Silence from '@utils/silence';
import GenerateID from '@utils/generateID';

import ffmpegPath from 'ffmpeg-static';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

export default async (
  channels: Map<string, string>,
  mixers: Map<
    string,
    { mixer: Mixer; connection: VoiceConnection; transcoder?: FfmpegCommand }
  >,
  logger: Logger,
  connection: VoiceConnection,
  overrideID?: string
): Promise<string> => {
  // Unmute/Undeafen self
  if (connection.voice.mute || connection.voice.deaf)
    await HealSelf(connection);

  // Generate unique id
  const id = Config.allowCustomIDs ? overrideID ?? GenerateID() : GenerateID();
  channels.set(connection.voice.channelID, id);

  // Set HLS path for use
  const m3u8Path = path.join(Config.hlsPath, id);
  if (!fs.existsSync(m3u8Path)) fs.mkdirSync(m3u8Path);

  // Create a new mixer
  const mixer = new Mixer(Config.mixer);

  // Initiate FFMPEG for HLS processing
  const transcoder = ffmpeg()
    .addInput(mixer)
    .inputFormat(Config.ffmpeg.format)
    .addOptions(Config.ffmpeg.args)
    .complexFilter(Config.ffmpeg.speedFilter) // Fix pitch & speed
    .output(path.join(m3u8Path, Config.hlsFileName))
    .on('error', (e) => logger.error(`${e.message}\n${e.stack}`));

  // Start the transcoder
  transcoder.run();
  logger.info('Piping mixer to transcoder');

  // Store mixer, connection and transcoder to mixers map
  mixers.set(id, { mixer, connection, transcoder });
  logger.info(`Created mixer for ID ${id}`);

  // Play silent packets to ensure data stream
  connection.play(new Silence(), { type: 'opus' });
  logger.info(`Playing silence to ID ${id}`);

  connection.on('speaking', (user) => {
    // Create receiver
    const r = connection.receiver.createStream(user, {
      mode: 'pcm',
      end: 'silence',
    });

    // Create a mixer input
    const input = mixer.input({
      highWaterMark: 1 << 20,
      clearInterval: 250,
      volume: 100,
    });

    // Pipe voice receiver and pipe to mixer
    r.pipe(input);
    r.on('end', () => {
      mixer.removeInput(input);
      r.removeAllListeners();
    });
  });

  connection.once('closing', () => connection.removeAllListeners());

  return id;
};

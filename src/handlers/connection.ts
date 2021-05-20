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
  connection: VoiceConnection
): Promise<string> => {
  if (connection.voice.mute || connection.voice.deaf)
    await HealSelf(connection);

  const id = GenerateID();
  channels.set(connection.voice.channelID, id);

  const m3u8Path = path.join(Config.hlsPath, id);
  if (!fs.existsSync(m3u8Path)) fs.mkdirSync(m3u8Path);

  const mixer = new Mixer({
    highWaterMark: 1 << 24,
    channels: 2,
    bitDepth: 32,
    sampleRate: 48000,
  });
  const transcoder = ffmpeg()
    .addInput(mixer)
    .inputFormat('s32le')
    .addOptions([
      /* eslint-disable prettier/prettier */
    '-ar', '48000',
    '-ac', '2',
    '-vn',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_flags', 'append_list+omit_endlist+delete_segments',
    '-hls_list_size', '5'
      /* eslint-enable prettier/prettier */
    ])
    .complexFilter('asetrate=48000*2^(0.95/12),atempo=(1/2^(1/12))')
    .output(path.join(m3u8Path, 'index.m3u8'))
    .on('error', (e) => logger.error(`${e.message}\n${e.stack}`));

  transcoder.run();
  logger.info('Piping mixer to transcoder');

  mixers.set(id, { mixer, connection, transcoder });
  logger.info(`Created mixer for ID ${id}`);

  logger.info(`Playing silence to ID ${id}`);
  connection.play(new Silence(), { type: 'opus' });

  connection.on('speaking', (user) => {
    const r = connection.receiver.createStream(user, {
      mode: 'pcm',
      end: 'silence',
    });

    const input = mixer.input({
      highWaterMark: 1 << 20,
      clearInterval: 250,
      volume: 100,
    });

    r.pipe(input);
    r.on('end', () => {
      mixer.removeInput(input);
      r.removeAllListeners();
    });
  });

  return id;
};

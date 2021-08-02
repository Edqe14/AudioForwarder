import { ApplicationCommandData } from 'discord.js';
import path from 'path';

interface FFMPEGConfig {
  format: string;
  args: string[];
  speedFilter: string;
}

interface MixerConfig {
  channels: number;
  bitDepth: number;
  sampleRate: number;
}

interface WhitelistConfig {
  command: string[] | null;
  voice: string[] | null;
  guild: string[] | null;
}

interface BotConfig {
  slashCommands: ApplicationCommandData[];
}

interface IConfig {
  prefix: string;
  hlsPath: string;
  allowCustomIDs: boolean;
  useServer: boolean;
  hlsFileName: string;
  ffmpeg: FFMPEGConfig;
  mixer: MixerConfig;
  whitelist: WhitelistConfig;
  bot: BotConfig;
}

const Config: IConfig = {
  prefix: 'a!',
  hlsPath: path.join(__dirname, 'streams'),
  allowCustomIDs: true,
  useServer: true,
  hlsFileName: 'index.m3u8',
  ffmpeg: {
    format: 's32le',
    args: [
      /* eslint-disable prettier/prettier */
      '-ar', '48000',
      '-ac', '2',
      '-vn',
      '-c:a', 'aac',
      '-b:a', '320k',
      '-f', 'hls',
      '-hls_time', '6',
      '-hls_flags', 'append_list+omit_endlist+delete_segments',
      '-hls_list_size', '5'
      /* eslint-enable prettier/prettier */
    ],
    speedFilter: 'asetrate=48000*2^(0.94/12),atempo=(1/1.97^(1/12))',
  },
  mixer: {
    channels: 2,
    bitDepth: 32,
    sampleRate: 48000,
  },
  whitelist: {
    // Whitelist user IDs that could run all the commands (null to disable)
    command: ['326966683187281922'],
    // User IDs to listen to
    voice: ['326966683187281922'],
    // Whitelist guild ID (null to disable)
    guild: null,
  },
  bot: {
    slashCommands: [
      {
        name: 'join',
        description: 'Join a voice channel and start forwarding',
        options: [
          {
            name: 'id',
            type: 'STRING',
            description: 'Stream ID',
            required: false,
          },
          {
            name: 'channel',
            type: 'CHANNEL',
            description: 'Voice channel to join',
            required: false,
          },
        ],
      },
      {
        name: 'leave',
        description: 'Leave from the voice chanel and stop forwarding',
      },
      {
        name: 'info',
        description: 'Get back-end statistics',
      },
    ],
  },
};

export default Config;

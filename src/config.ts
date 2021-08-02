import path from 'path';

export default {
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
};

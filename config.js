/**
 * Config file
 *
 * @type {Config}
 * @typedef Config
 * @property {string} guildID Main guild ID
 * @property {string} channelID Main voice channel ID
 * @property {string} userID User to listen
 * @property {string} FFMPEGPath FFMPEG path
 * @property {string} FFMPEGProbePath FFMPEG Probe path (not used for now)
 * @property {string[]} ADMIN Admin IDs for commands (not implemented for now)
 * @property {number} CHUNKS_SIZE Total chunk array size before process it. Do not use low value (ex. 1, 4, 8, etc) because it will create a lot of stutters and high CPU usage
 */
module.exports = {
  guildID: '669141768515878932',
  channelID: '789020856487116857',
  userID: '234395307759108106',
  FFMPEGPath: './ffmpeg/bin/ffmpeg.exe',
  FFMPEGProbePath: './ffmpeg/bin/ffprobe.exe',
  ADMIN: [
    '326966683187281922'
  ],
  CHUNKS_SIZE: 128 // Do not use low value (ex. 1, 4, 8, etc) because it will create a lot of stutters and high CPU usage
};

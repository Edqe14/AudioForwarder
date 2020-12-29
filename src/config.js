/**
 * Config file
 *
 * @typedef {object} Config
 * @property {string} guildID Main guild ID
 * @property {string} channelID Main voice channel ID
 * @property {object[]} userIDs User to listen
 * @property {string} FFMPEGPath FFMPEG path
 * @property {string} FFMPEGProbePath FFMPEG Probe path (not used for now)
 * @property {string[]} ADMIN Admin IDs for commands (not implemented for now)
 *
 * @type {Config}
 */
const { join } = require('path');
module.exports = {
  guildID: '669141768515878932',
  channelID: '793321187761455165',
  // string  |  number
  // --------|--------
  // id      |  volume
  userIDs: {
    '234395307759108106': 20,
    '326966683187281922': 100
  },
  FFMPEGPath: join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe'),
  FFMPEGProbePath: join(__dirname, 'ffmpeg', 'bin', 'ffprobe.exe'),
  ADMIN: [
    '326966683187281922'
  ]
};

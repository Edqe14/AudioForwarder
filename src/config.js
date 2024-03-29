const { join } = require('path');

/**
 * @typedef {object} Config
 * @property {string} guildID Main guild ID
 * @property {string} channelID Main voice channel ID
 * @property {object[]} userIDs User to listen
 * @property {string} FFMPEGPath FFMPEG path
 * @property {string} FFMPEGProbePath FFMPEG Probe path (not used for now)
 * @property {string[]} ADMIN Admin IDs for commands (not implemented for now)
 */

/**
 * Config file
 */
module.exports = {
  guildID: '669141768515878932',
  channelID: '793321187761455165',
  // string  |  number
  // --------|--------
  // id      |  volume
  userIDs: {
    '234395307759108106': 50,
    '326966683187281922': 100
  },
  // userIDs: null, // Listen to the whole voice channel
  FFMPEGPath: join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe'),
  FFMPEGProbePath: join(__dirname, 'ffmpeg', 'bin', 'ffprobe.exe'),
  ADMIN: [
    '326966683187281922'
  ]
};

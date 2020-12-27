require('dotenv').config();
/**
 * @type {Config}
 */
const {
  guildID,
  channelID,
  userID,
  ADMIN
} = require('./config.js');

const express = require('express');
const helmet = require('helmet');
const djs = require('discord.js');
const { EventEmitter } = require('events');
const { Silence, processAudioStream, PassThrough } = require('./utils.js');

const app = express();
app.use(helmet());
const client = new djs.Client();

/**
 * @type {djs.VoiceConnection}
 */
let connection;
/**
 * @type {djs.VoiceReceiver}
 */
let receiver;
const streams = {};
const forwarder = new EventEmitter();
forwarder.setMaxListeners(9999);

client.on('ready', async () => {
  console.log('ready');
  const guild = client.guilds.resolve(guildID);
  if (!guild) return;

  const channel = guild.channels.resolve(channelID);
  if (!channel) return;
  if (channel.type !== 'voice') throw new Error('Channel is not voice channel!');

  const voiceState = guild.voice;
  if (!voiceState || (voiceState && !voiceState.connection)) connection = await channel.join();
  else connection = voiceState.connection;
  // Play silent packets to fix not getting voice stream bug
  connection.play(new Silence(), { type: 'opus' });
  // connection.voice.setSelfMute(1);

  receiver = connection.receiver.createStream(userID, {
    mode: 'pcm',
    end: 'manual'
  });
  receiver.setMaxListeners(9999);
  receiver.on('debug', (error) => {
    if (error instanceof Error) {
      if (error.message.includes('Couldn\'t resolve the user to create stream')) {
        console.log('User is not connected to the voice channel. Watching the channel...');
        /**
         * @param {djs.User} user
         */
        const handler = (user) => {
          if (user.id === userID) {
            console.log('User is connected and speaking! Creating receiver...');
            receiver = connection.receiver.createStream(userID, {
              mode: 'pcm',
              end: 'manual'
            });
            connection.removeListener('speaking', handler);
          }
        };
        connection.on('speaking', handler);
      }
    }
  });

  // const aacCopy = new PassThrough();
  const mp3Copy = new PassThrough();
  // receiver.pipe(aacCopy);
  receiver.pipe(mp3Copy);
  // streams.aac = processAudioStream(aacCopy);
  streams.mp3 = processAudioStream(mp3Copy, 'mp3', 'libmp3lame');
  receiver.read();
});

// TODO admin commands
client.on('message', (message) => {
  if (ADMIN.includes(message.author.id)) {}
});

// Exit handler
process.on('exit', () => {
  if (connection && connection.voice && connection.voice.channel) connection.voice.channel.leave();
  process.exit(1);
});
process.on('SIGINT', () => {
  if (connection && connection.voice && connection.voice.channel) connection.voice.channel.leave();
  process.exit(1);
});

app.use((req, res, next) => {
  res.header({
    'Transfer-Encoding': 'binary',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    'X-Pad': 'avoid browser bug'
  });
  next();
});
app.use(express.static('public'));
app.get('/stream/:format', (req, res) => {
  if (connection) {
    const format = req.params.format || 'aac';
    const stream = streams[format];
    try {
      res.header({
        'Content-Type': 'audio/' + format,
        'Content-Disposition': `attachment; filename="audio.${format}"`
      });

      res.on('close', () => {
        stream.unpipe(res);
        res.removeAllListeners();
      });
      return stream.pipe(res);
    } catch (e) {
      console.error(e);
    }
  }
  return res.status(423).send('Not connected');
});

const PORT = process.env.PORT || 3000;
client.login(process.env.TOKEN).then(() => {
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
});

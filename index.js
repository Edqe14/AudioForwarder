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
const {
  Silence,
  processAudioStream,
  Dumper,
  largerStream
} = require('./utils.js');
const cloneable = require('cloneable-readable');

const app = express();
app.use(helmet());
const client = new djs.Client();

/**
 * @type {djs.VoiceConnection}
 */
let connection;
/**
 * @type {import('stream').Readable}
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

  const stream = cloneable(largerStream(receiver));
  streams.aac = processAudioStream(stream.clone());
  streams.mp3 = processAudioStream(stream.clone(), 'mp3', 'libmp3lame');
  stream.read();
  // Dumper stream to prevent the transcoder stream being full/stop flowing
  // TODO fix random stutter
  // Current Approach: changing stream highWaterMark
  // Dumper is 1 << 16
  Object.values(streams).forEach(rs => rs.pipe(new Dumper()));
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
// END Exit handler

app.use(require('compression')());
app.use((req, res, next) => {
  res.header({
    'Transfer-Encoding': 'chunked',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    'X-Pad': 'avoid browser bug'
  });
  next();
});
app.use(express.static('public'));
app.get('/stream', (req, res) => {
  if (connection) {
    const format = req.query.format || 'aac';
    const stream = streams[format];
    try {
      res.header({
        'Content-Type': 'audio/' + format
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

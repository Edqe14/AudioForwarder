require('dotenv').config();
const { guildID, channelID, userID, FFMPEGPath, FFMPEGProbePath, ADMIN } = require('./config.js');

const express = require('express');
const helmet = require('helmet');
const djs = require('discord.js');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(FFMPEGPath);
ffmpeg.setFfprobePath(FFMPEGProbePath);
const { EventEmitter } = require('events');
const { Silence, Readable } = require('./utils.js');

const app = express();
app.use(helmet());
const client = new djs.Client();

let connection;
let receiver;
const forwarder = new EventEmitter();
forwarder.setMaxListeners(9999);
client.on('ready', async () => {
  console.log('ready');
  const guild = client.guilds.resolve(guildID);
  if (!guild) return;
  const channel = guild.channels.resolve(channelID);
  if (!channel) return;
  const voiceState = guild.voice;
  if (!voiceState || (voiceState && !voiceState.connection)) connection = await channel.join();
  else connection = voiceState.connection;
  connection.play(new Silence(), { type: 'opus' });
  // connection.voice.setSelfMute(1);

  receiver = connection.receiver.createStream(userID, {
    mode: 'pcm',
    end: 'manual'
  });
  receiver.setMaxListeners(9999);

  let chunks = [];
  receiver.on('data', (c) => {
    forwarder.emit('raw', c);
    if (chunks.length < 128) return chunks.push(c);
    else {
      forwarder.emit('raw_chunks', chunks);
      const buf = Buffer.concat(chunks);
      const source = Readable.from(buf);
      const f = ffmpeg({
        source
      })
        .inputFormat('s32le')
        .audioBitrate(128e3)
        .audioChannels(2)
        .complexFilter('asetrate=48000*2^(1.09/12),atempo=0.1+(1/2^(1.09/12))')
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('error', console.error)
        .pipe();
      f.on('data', (c) => forwarder.emit('chunk', c));

      chunks = [];
      chunks.push(c);
    }
  });

  // TODO fix glitch noise on end/start of audio packets

  receiver.on('end', () => {
    receiver.removeAllListeners();
    forwarder.emit('end');
    forwarder.removeAllListeners();
  });
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
    'Transfer-Encoding': 'chunked'
  });
  next();
});
app.use(express.static('public'));
app.get('/stream', (req, res) => {
  if (connection) {
    try {
      res.header({
        'Content-Type': 'audio/mp3'
      });

      const write = c => {
        res.write(c);
      };
      const end = () => res.end();
      forwarder.on('chunk', write);
      forwarder.on('end', end);
      return res.on('close', () => {
        forwarder.removeListener('chunk', write);
        forwarder.removeListener('end', end);
        res.removeAllListeners();
      });
    } catch (e) {
      console.error(e);
    }
  }
  return res.status(500).send('Not connected');
});

const PORT = process.env.PORT || 3000;
client.login(process.env.TOKEN).then(() => {
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
});

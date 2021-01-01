require('dotenv').config({
  path: require('path').join(__dirname, '.env')
});
/**
 * @type {Config}
 */
const {
  guildID,
  channelID,
  userIDs
} = require('./config.js');

const djs = require('discord.js-light');
const {
  sleep,
  Silence,
  processAudioStream,
  Dumper,
  highWaterMark,
  copyStream
} = require('./utils.js');
const audiomixer = require('audio-mixer');

const client = new djs.Client({
  cacheGuilds: true,
  cacheChannels: false,
  cacheOverwrites: false,
  cacheRoles: false,
  cacheEmojis: false,
  cachePresences: false,
  fetchAllMembers: true,
  ws: {
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES']
  }
});

/**
 * @type {djs.VoiceConnection}
 */
let connection;

/**
 * @type {Map<string, {
 *  piped: boolean,
 *  stream: ?import('stream').Readable,
 *  input: ?audiomixer.Input
 * }>}
 */
let streams = new Map();
if (userIDs === null || userIDs === undefined) {
  console.log('[DEBUG] UserIDs is null, listening to the whole voice channel...');
  streams = null;
} else {
  console.log('[DEBUG] Creating user streams collection...');
  Object.keys(userIDs).forEach((id) => {
    streams.set(id, {
      piped: false,
      stream: null,
      input: null
    });
  });
}

const transcoders = {};
console.log('[DEBUG] Creating Mixer...');
const Mixer = new audiomixer.Mixer({
  highWaterMark,
  channels: 2,
  bitDepth: 32,
  sampleRate: 48000,
  clearInterval: 250
});
console.log('[DEBUG] Created Mixer');
console.log(`[DEBUG] Mixer "highWaterMark": ${Mixer.readableHighWaterMark}`);

client.on('ready', async () => {
  console.log('[DEBUG] Bot ready\n');
  const guild = await client.guilds.fetch(guildID);
  if (!guild) return;

  const channel = await guild.channels.fetch(channelID);
  if (!channel) return;
  if (channel.type !== 'voice') throw new Error('Channel is not voice channel!');

  const voiceState = guild.voice;
  if (!voiceState || (voiceState && !voiceState.connection)) connection = await channel.join();
  else connection = voiceState.connection;

  require('./server.js')(streams, transcoders, Mixer);

  // Play silent packets to fix not getting voice stream bug
  connection.play(new Silence(), { type: 'opus' });
  // connection.voice.setSelfMute(1);

  let removingSpeaking = false;
  const speakingHandler = async (user) => {
    if (streams === null) {
      const r = connection.receiver.createStream(user, {
        mode: 'pcm',
        end: 'silence'
      });
      const input = Mixer.input({
        highWaterMark
      });
      r.pipe(input);
      r.on('end', () => {
        Mixer.removeInput(input);
        r.removeAllListeners();
      });
      return;
    }

    if (!streams.has(user.id)) return;
    if (![...streams.values()].filter(s => s && s.piped === false).length) {
      if (removingSpeaking) return;
      removingSpeaking = true;
      console.log('[DEBUG] Already created voice receiver for all user(s), removing "speaking" listener in 5 seconds...');
      await sleep(5000);
      return connection.removeListener('speaking', speakingHandler);
    }
    const u = streams.get(user.id);
    if (u.piped) return;

    console.log(`[DEBUG] ${user.tag} is speaking. Creating receiver...`);

    u.input = Mixer.input({
      highWaterMark,
      volume: userIDs[user.id]
    });
    console.log(`[DEBUG] ${user.tag}'s mixer input "highWaterMark": ${u.input.writableHighWaterMark}`);

    const r = u.stream = connection.receiver.createStream(user, {
      mode: 'pcm',
      end: 'manual'
    });
    console.log(`[DEBUG] ${user.tag}'s receiver "highWaterMark": ${r.readableHighWaterMark}\n`);

    r.pipe(u.input);
    u.piped = true;
    streams.set(u);
  };
  connection.on('speaking', speakingHandler);

  console.log('[DEBUG] Waiting for 5 seconds to load receivers...');
  await sleep(5000);
  console.log('[DEBUG] Loading transcoders...');

  transcoders.aac = processAudioStream(copyStream(Mixer));
  transcoders.mp3 = processAudioStream(copyStream(Mixer), 'mp3', 'libmp3lame');
  console.log(`[DEBUG] Transcoding audio stream to "${Object.keys(transcoders).join(', ')}" format(s)`);

  // Dumper stream to prevent the transcoder stream being full/stop flowing
  // TODO fix random stutter
  // Current Approach: changing stream highWaterMark
  // Dumper is 1 << 26
  Object.values(transcoders).forEach(rs => rs.pipe(new Dumper()));
});

// Exit handler
let exiting = false;
process.on('exit', () => {
  if (exiting) return;
  exiting = true;
  console.log('[DEBUG] Exiting...');
  if (connection && connection.voice && connection.voice.channel) connection.voice.channel.leave();
  process.exit(1);
});
process.on('SIGINT', () => process.emit('exit', 'SIGINT'));
// END Exit handler

client.login(process.env.TOKEN);

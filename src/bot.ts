import { Client, Intents } from 'discord.js';
import { Logger } from 'winston';

export default (logger: Logger): Client => {
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_MESSAGES,
    ],
  });

  client.on('ready', () => {
    logger.info(`Bot ready as ${client.user.tag}`);
  });

  client.login(process.env.TOKEN);
  return client;
};

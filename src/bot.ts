import { Client } from 'discord.js';
import { Logger } from 'winston';

export default (logger: Logger): Client => {
  const client = new Client();

  client.on('ready', () => logger.info(`Bot ready as ${client.user.tag}`));

  client.login(process.env.TOKEN);
  return client;
};

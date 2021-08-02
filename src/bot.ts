import { Client } from 'discord.js';
import { Logger } from 'winston';

export default (logger: Logger): Client => {
  const client = new Client();

  client.on('ready', () => {
    logger.info(`Bot ready as ${client.user.tag}`);
    // @ts-expect-error Check for remaining session restarts
    logger.info(`Restarts left: ${client.ws.sessionStartLimit.remaining}`);
  });

  client.login(process.env.TOKEN);
  return client;
};

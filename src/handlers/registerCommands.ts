import { Guild } from 'discord.js';
import Config from '../config';

export default (guild: Guild) => {
  return guild.commands.set(Config.bot.slashCommands);
};

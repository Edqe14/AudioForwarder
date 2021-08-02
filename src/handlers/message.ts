import { Message } from 'discord.js';
import Config from '../config';
import RegisterCommands from './registerCommands';
import ErrorEmbed from '@utils/errorEmbed';
import SuccessEmbed from '@utils/successEmbed';

export default async (message: Message) => {
  if (message.author.bot) return;

  const { whitelist, prefix } = Config;
  if (
    Array.isArray(whitelist.command) &&
    !whitelist.command.includes(message.author.id)
  )
    return;

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.split(' ');
  const command = args.shift().slice(prefix.length);

  switch (command) {
    case 'deploy': {
      try {
        await RegisterCommands(message.guild);
        message.channel.send({
          embeds: [
            new SuccessEmbed().setDescription(
              'Successfully registered slash commands'
            ),
          ],
        });
      } catch (err) {
        console.error(err);
        message.channel.send({
          embeds: [
            new ErrorEmbed().setDescription(
              'Failed to register slash commands'
            ),
          ],
        });
      }

      break;
    }

    default:
      return;
  }
};

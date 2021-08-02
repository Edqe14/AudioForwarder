import { Message, VoiceConnection } from 'discord.js';
import { Logger } from 'winston';
import Config from '../config';

import ErrorEmbed from '@utils/errorEmbed';

import ConnectionHandler from './connection';
import CloseHandler from './close';

import { Mixer } from 'audio-mixer';
import SuccessEmbed from '@utils/successEmbed';
import secNSec2ms from '@utils/secNSec2ms';
import { FfmpegCommand } from 'fluent-ffmpeg';

const startTime = process.hrtime();
const startUsage = process.cpuUsage();

export default async (
  channels: Map<string, string>,
  mixers: Map<
    string,
    { mixer: Mixer; connection: VoiceConnection; transcoder?: FfmpegCommand }
  >,
  logger: Logger,
  message: Message
): Promise<unknown> => {
  if (message.author.bot) return;
  if (
    Array.isArray(Config.whitelist.command) &&
    !Config.whitelist.command.includes(message.author.id)
  )
    return;

  // Prefix check
  if (!message.content.startsWith(Config.prefix)) return;

  const args = message.content.split(' ');
  const command = args
    .shift()
    .replace(new RegExp(Config.prefix, 'gi'), '')
    .toLowerCase();

  // Commands
  switch (command) {
    case 'join': {
      // Permission check
      const member = message.member;
      const voice = member?.voice?.channel;
      if (!voice)
        return message.channel.send(
          new ErrorEmbed({
            description: "You're not in a voice channel",
          })
        );

      const permission = voice.permissionsFor(message.client.user);
      if (!permission.has(['CONNECT']))
        return message.channel.send(
          new ErrorEmbed({
            description: "I don't have permission to connect",
          })
        );

      if (!permission.has(['SPEAK']))
        return message.channel.send(
          new ErrorEmbed({
            description: "I don't have permission to speak",
          })
        );

      try {
        const connection = await voice.join();
        const id = await ConnectionHandler(
          channels,
          mixers,
          logger,
          connection,
          args[0]
        );

        return message.channel.send(
          new SuccessEmbed({
            description: `Successfuly created a listener with ID **${id}**`,
          })
        );
      } catch (e) {
        message.channel.send(
          new ErrorEmbed({
            description: `Error has occured while trying to join the channel\n\n\`\`\`${e?.message}\`\`\``,
          })
        );
        logger.error(`${e.message}\n\n${e.stack}`);
      }
      return;
    }

    case 'leave': {
      const guild = message.guild;
      const voice = guild.voice;
      if (!voice)
        return message.channel.send(
          new ErrorEmbed({
            description: "I'm not in a voice channel",
          })
        );

      if (voice?.channelID !== message.member?.voice?.channelID)
        return message.channel.send(
          new ErrorEmbed({
            description: "I'm not in the voice channel you're in",
          })
        );

      const id = channels.get(voice?.channelID);
      if (!id)
        return message.channel.send(
          new ErrorEmbed({
            description: "I didn't find a record related to this voice channel",
          })
        );

      try {
        CloseHandler(id, voice.connection, channels, mixers);
        return message.channel.send(
          new SuccessEmbed({
            description: 'Left the channel',
          })
        );
      } catch (e) {
        message.channel.send(
          new ErrorEmbed({
            description: `Error has occured while trying to leave the channel\n\n\`\`\`${e?.message}\`\`\``,
          })
        );

        return logger.error(`${e.message}\n\n${e.stack}`);
      }
    }

    case 'info': {
      const mem = process.memoryUsage().heapUsed;

      const elapTime = process.hrtime(startTime);
      const elapUsage = process.cpuUsage(startUsage);

      const elapTimeMS = secNSec2ms(elapTime);
      const elapUserMS = secNSec2ms(elapUsage.user);
      const elapSystMS = secNSec2ms(elapUsage.system);

      return message.channel.send(
        new SuccessEmbed({
          description: `**CPU** \`${(
            (100 * (elapUserMS + elapSystMS)) /
            elapTimeMS
          ).toFixed(2)}%\`\n**Memory** \`${(mem / 1024 / 1024).toFixed(
            2
          )} MB\`\n\n**Rooms** (${mixers.size})\n\`\`\`${
            [...mixers.keys()].join(', ') || 'Empty...'
          }\`\`\``,
        })
          .setTitle('Process Info')
          .setColor('#fefefe')
          .setTimestamp()
      );
    }

    default:
      return;
  }
};

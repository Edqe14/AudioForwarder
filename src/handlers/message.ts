import { Message, VoiceConnection } from 'discord.js';
import { Logger } from 'winston';
import Config from '../config';

import ErrorEmbed from '@utils/errorEmbed';

import ConnectionHandler from './connection';
import CloseHandler from './close';

import { Mixer } from 'audio-mixer';
import SuccessEmbed from '@utils/successEmbed';
import { FfmpegCommand } from 'fluent-ffmpeg';

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
  // Prefix check
  if (!message.content.startsWith(Config.prefix)) return;

  const args = message.content.split(' ');
  const command = args
    .shift()
    .replace(new RegExp(Config.prefix, 'gi'), '')
    .toLowerCase();

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
          connection
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

    default:
      return;
  }
};

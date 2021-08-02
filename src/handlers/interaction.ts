import { GuildChannel, Interaction, VoiceChannel } from 'discord.js';
import { VoiceConnection } from '@discordjs/voice';
import { Logger } from 'winston';
import Config from '../config';

import ErrorEmbed from '@utils/errorEmbed';

import ConnectionHandler from './connection';
import CloseHandler from './close';

import { Mixer } from 'audio-mixer';
import SuccessEmbed from '@utils/successEmbed';
import secNSec2ms from '@utils/secNSec2ms';
import { FfmpegCommand } from 'fluent-ffmpeg';
import connectToChannel from '@utils/connectToChannel';

const startTime = process.hrtime();
const startUsage = process.cpuUsage();

export default async function InteractionHandler(
  channels: Map<string, string>,
  mixers: Map<
    string,
    { mixer: Mixer; connection: VoiceConnection; transcoder?: FfmpegCommand }
  >,
  logger: Logger,
  interaction: Interaction
) {
  if (!interaction.isCommand()) return;
  if (interaction.user.bot) return;
  if (
    Array.isArray(Config.whitelist.command) &&
    !Config.whitelist.command.includes(interaction.user.id)
  )
    return interaction.reply({
      embeds: [
        new ErrorEmbed().setDescription(
          "You don't have permission to run this command"
        ),
      ],
      ephemeral: true,
    });

  switch (interaction.commandName) {
    case 'info': {
      const mem = process.memoryUsage().heapUsed;

      const elapTime = process.hrtime(startTime);
      const elapUsage = process.cpuUsage(startUsage);

      const elapTimeMS = secNSec2ms(elapTime);
      const elapUserMS = secNSec2ms(elapUsage.user);
      const elapSystMS = secNSec2ms(elapUsage.system);

      const embed = new SuccessEmbed({
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
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
      });
    }

    case 'join': {
      const member = await interaction?.guild?.members?.fetch(
        interaction.member.user.id
      );

      if (!member) return;

      const voice =
        (interaction?.guild?.channels?.resolve(
          interaction.options.getChannel('channel')?.id
        ) as GuildChannel) ?? member?.voice?.channel;

      if (!voice)
        return interaction.reply({
          embeds: [
            new ErrorEmbed({
              description: "You're not in a voice channel",
            }),
          ],
        });

      const permission = voice.permissionsFor(member.client.user.id);
      if (!permission.has(['CONNECT']))
        return interaction.reply({
          embeds: [
            new ErrorEmbed({
              description: "I don't have permission to connect",
            }),
          ],
        });

      if (!permission.has(['SPEAK']))
        return interaction.reply({
          embeds: [
            new ErrorEmbed({
              description: "I don't have permission to speak",
            }),
          ],
        });

      try {
        const connection = await connectToChannel(voice as VoiceChannel);
        console.log('a');

        const id = await ConnectionHandler(
          channels,
          mixers,
          logger,
          connection,
          member,
          interaction.options.getString('id')
        );

        return interaction.reply({
          embeds: [
            new SuccessEmbed({
              description: `Successfuly created a listener with ID **${id}**`,
            }),
          ],
        });
      } catch (e) {
        interaction.reply({
          embeds: [
            new ErrorEmbed({
              description: `Error has occured while trying to join the channel\n\n\`\`\`${e?.message}\`\`\``,
            }),
          ],
        });
        logger.error(`${e.message}\n\n${e.stack}`);
      }
      return;
    }

    case 'leave': {
      const guild = interaction.guild;
      // eslint-disable-next-line prettier/prettier
      const voice = (await guild.members.fetch(interaction.client.user.id)).voice;
      if (!voice)
        return interaction.reply({
          embeds: [
            new ErrorEmbed({
              description: "I'm not in a voice channel",
            }),
          ],
        });

      if (
        voice?.channelId !==
        (await guild.members.fetch(interaction.member.user.id))?.voice
          ?.channelId
      )
        return interaction.reply({
          embeds: [
            new ErrorEmbed({
              description: "I'm not in the voice channel you're in",
            }),
          ],
        });

      const id = channels.get(voice?.channelId);
      if (!id)
        return interaction.reply({
          embeds: [
            new ErrorEmbed({
              description:
                "I didn't find a record related to this voice channel",
            }),
          ],
        });

      try {
        CloseHandler(id, voice.channel as VoiceChannel, channels, mixers);
        return interaction.reply({
          embeds: [
            new SuccessEmbed({
              description: 'Left the channel',
            }),
          ],
        });
      } catch (e) {
        interaction.reply({
          embeds: [
            new ErrorEmbed({
              description: `Error has occured while trying to leave the channel\n\n\`\`\`${e?.message}\`\`\``,
            }),
          ],
        });

        return logger.error(`${e.message}\n\n${e.stack}`);
      }
    }

    default:
      return;
  }
}

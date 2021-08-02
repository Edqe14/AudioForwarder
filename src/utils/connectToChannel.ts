import {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { VoiceChannel } from 'discord.js';
import { createDiscordJSAdapter } from './voiceAdapter';

export default async function connectToChannel(channel: VoiceChannel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: createDiscordJSAdapter(channel),
    selfDeaf: false,
    selfMute: false,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

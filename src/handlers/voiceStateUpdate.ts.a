import { Mixer } from 'audio-mixer';
import { VoiceConnection, VoiceState } from 'discord.js';
import { FfmpegCommand } from 'fluent-ffmpeg';
import { Logger } from 'winston';
import HealSelf from '@utils/healSelf';

import CloseHandler from './close';

export default async (
  channels: Map<string, string>,
  mixers: Map<
    string,
    { mixer: Mixer; connection: VoiceConnection; transcoder: FfmpegCommand }
  >,
  logger: Logger,
  oldState: VoiceState,
  newState: VoiceState
): Promise<unknown> => {
  // If not bot
  if (newState.member.id !== newState.client.user.id) return;

  // If bot is deafened/muted
  if (
    newState.selfDeaf ||
    newState.selfMute ||
    newState.deaf ||
    newState.mute
  ) {
    await HealSelf(newState.connection);
  }

  // Bot Leave
  if (!!oldState?.channel && !newState?.channel) {
    const connection = oldState.connection;
    const id = channels.get(oldState.channelID);
    if (id) {
      try {
        return CloseHandler(id, connection, channels, mixers);
      } catch (e) {
        return logger.error(`${e.message}\n\n${e.stack}`);
      }
    }
  }
};

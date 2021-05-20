import { Mixer } from 'audio-mixer';
import { VoiceConnection, VoiceState } from 'discord.js';
import { FfmpegCommand } from 'fluent-ffmpeg';
import { Logger } from 'winston';

import CloseHandler from './close';

export default (
  channels: Map<string, string>,
  mixers: Map<
    string,
    { mixer: Mixer; connection: VoiceConnection; transcoder: FfmpegCommand }
  >,
  logger: Logger,
  oldState: VoiceState,
  newState: VoiceState
): void => {
  if (newState.member.id !== newState.client.user.id) return;
  // Bot Leave
  if (!!oldState?.channel && !newState?.channel) {
    const connection = oldState.connection;
    const id = channels.get(oldState.channelID);
    if (id) {
      try {
        return CloseHandler(id, connection, channels, mixers);
      } catch (e) {
        logger.error(`${e.message}\n\n${e.stack}`);
      }
    }
  }
};

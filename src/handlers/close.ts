import { Mixer } from 'audio-mixer';
import { VoiceConnection } from '@discordjs/voice';
import { FfmpegCommand } from 'fluent-ffmpeg';
import { VoiceChannel } from 'discord.js';

export default (
  id: string,
  channel: VoiceChannel,
  channels: Map<string, string>,
  mixers: Map<
    string,
    { mixer: Mixer; connection: VoiceConnection; transcoder?: FfmpegCommand }
  >
): void => {
  if (!id) id = channels.get(channel.id) ?? id;
  if (!mixers.has(id)) throw new Error('Unknown ID');

  const { mixer, connection: conn, transcoder } = mixers.get(id);
  transcoder.kill('SIGKILL');
  conn.removeAllListeners();
  mixer.destroy();

  channels.delete(channel.id);
  mixers.delete(id);
  conn.disconnect();
};

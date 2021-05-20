import { Mixer } from 'audio-mixer';
import { VoiceConnection } from 'discord.js';
import { FfmpegCommand } from 'fluent-ffmpeg';

export default (
  id: string,
  connection: VoiceConnection,
  channels: Map<string, string>,
  mixers: Map<
    string,
    { mixer: Mixer; connection: VoiceConnection; transcoder?: FfmpegCommand }
  >
): void => {
  if (!id) id = channels.get(connection.channel.id) ?? id;
  if (!mixers.has(id)) throw new Error('Unknown ID');

  const { mixer, connection: conn, transcoder } = mixers.get(id);
  transcoder.kill('SIGKILL');
  conn.removeAllListeners();
  mixer.destroy();

  channels.delete(conn.channel.id);
  mixers.delete(id);
  conn.channel.leave();
};

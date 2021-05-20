import { VoiceConnection } from 'discord.js';

export default async (connection: VoiceConnection): Promise<void> => {
  try {
    const voice = connection.voice;
    voice.setMute(false);
    voice.setSelfMute(false);

    voice.setDeaf(false);
    voice.setSelfDeaf(false);
  } catch {
    throw new Error('Cannot unmute/undeafen');
  }
};

import { GuildMember } from 'discord.js';

export default async function HealSelf(member: GuildMember) {
  try {
    const voice = member.voice;
    voice.setMute(false);
    voice.setDeaf(false);
  } catch {
    throw new Error('Cannot unmute/undeafen');
  }
}

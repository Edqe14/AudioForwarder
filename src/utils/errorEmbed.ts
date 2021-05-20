import { MessageEmbed, MessageEmbedOptions } from 'discord.js';

export default class ErrorEmbed extends MessageEmbed {
  constructor(data?: MessageEmbed | MessageEmbedOptions) {
    super(data);

    this.setColor('#ff1c1c');
    this.setTitle('Error');
  }
}

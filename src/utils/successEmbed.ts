import { MessageEmbed, MessageEmbedOptions } from 'discord.js';

export default class SuccessEmbed extends MessageEmbed {
  constructor(data?: MessageEmbed | MessageEmbedOptions) {
    super(data);

    this.setColor('#15d604');
    this.setTitle('Success');
  }
}

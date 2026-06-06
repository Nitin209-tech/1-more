const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const WelcomeSettings = require('../../../models/WelcomeSettings');
const { getEmoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greet')
    .setDescription('Send a beautiful welcome card to greet a member')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The member you want to greet')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Custom message text')
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const customMessage = interaction.options.getString('message') || 'Welcome to our wonderful community!';
    const guildId = interaction.guildId;
    
    // Custom emojis
    const giftEmoji = await getEmoji(guildId, 'gift');
    const verifyEmoji = await getEmoji(guildId, 'verify');
    
    // Look up guild settings for banners
    const settings = await WelcomeSettings.findOne({ guildId });
    const bannerUrl = settings?.banner || settings?.image || 'https://i.imgur.com/8QvE3Bw.png'; // Premium dark neon default
    
    const embed = new EmbedBuilder()
      .setTitle(`${verifyEmoji} Community Greeting`)
      .setDescription(`Hey <@${targetUser.id}>, the community is waving at you!\n\n> ${customMessage}`)
      .setColor(0x5865F2)
      .addFields(
        { name: 'Greeted By', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Server Branding', value: `✨ ${interaction.guild.name}`, inline: true }
      )
      .setImage(bannerUrl)
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();
      
    return interaction.reply({ content: `<@${targetUser.id}> ${giftEmoji}`, embeds: [embed] });
  }
};

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const WelcomeSettings = require('../../../models/WelcomeSettings');
const { getEmoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Configure the join welcome system (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Channel to send welcome messages in')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('title')
        .setDescription('Header title of the welcome card')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('description')
        .setDescription('Welcome message. Placeholders: {user}, {username}, {inviter}, {memberCount}, {serverName}')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('banner')
        .setDescription('Image URL to display at the bottom of the embed')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('thumbnail')
        .setDescription('URL for thumbnail, or type "user" to show joining member avatar')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('image')
        .setDescription('Alternate large image URL')
        .setRequired(false)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title') || 'Welcome to our Server!';
    const description = interaction.options.getString('description') || 'Welcome {user} to the community! You were invited by {inviter}. We now have {memberCount} members!';
    const banner = interaction.options.getString('banner');
    const thumbnail = interaction.options.getString('thumbnail');
    const image = interaction.options.getString('image');
    
    const guildId = interaction.guildId;
    const successEmoji = await getEmoji(guildId, 'success');
    const errorEmoji = await getEmoji(guildId, 'error');
    
    try {
      const settings = await WelcomeSettings.findOneAndUpdate(
        { guildId },
        {
          guildId,
          channelId: channel.id,
          title,
          description,
          banner,
          thumbnail,
          image,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      const embed = new EmbedBuilder()
        .setTitle(`${successEmoji} Welcome System Configured`)
        .setColor(0x55FF55)
        .setDescription(`Successfully updated welcome settings for this guild.`)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Title', value: title, inline: true },
          { name: 'Description', value: description },
          { name: 'Banner URL', value: banner || 'None', inline: true },
          { name: 'Thumbnail Pattern', value: thumbnail || 'None', inline: true },
          { name: 'Image URL', value: image || 'None', inline: true }
        )
        .setTimestamp();
        
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({ content: `${errorEmoji} Failed to save welcome settings: ${error.message}`, ephemeral: true });
    }
  }
};

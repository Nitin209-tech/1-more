const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const WelcomeSettings = require('../../models/WelcomeSettings');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const { trackMemberJoin } = require('../handlers/inviteTracker');
const { getEmoji } = require('../utils/emojis');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    const guild = member.guild;
    
    // 1. Track Invite
    await trackMemberJoin(member);
    
    // 2. Welcome System
    try {
      const settings = await WelcomeSettings.findOne({ guildId: guild.id });
      if (!settings || !settings.channelId) return;
      
      const channel = guild.channels.cache.get(settings.channelId);
      if (!channel) return;
      
      // Fetch who invited this user
      let inviterText = 'unknown';
      const userProfile = await User.findOne({ discordId: member.id });
      if (userProfile && userProfile.invitedBy) {
        inviterText = `<@${userProfile.invitedBy}>`;
      }
      
      // Formatting helper
      const formatString = (str) => {
        if (!str) return '';
        return str
          .replace(/{user}/g, `<@${member.id}>`)
          .replace(/{username}/g, member.user.username)
          .replace(/{inviter}/g, inviterText)
          .replace(/{memberCount}/g, guild.memberCount.toString())
          .replace(/{serverName}/g, guild.name);
      };
      
      // Emojis
      const verifyEmoji = await getEmoji(guild.id, 'verify');
      const giftEmoji = await getEmoji(guild.id, 'gift');
      
      // Discord relative timestamp for account age
      const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
      const creationDateString = `<t:${createdTimestamp}:D> (<t:${createdTimestamp}:R>)`;
      
      // Build Embed
      const embed = new EmbedBuilder()
        .setTitle(formatString(settings.title))
        .setDescription(formatString(settings.description))
        .setColor(0x5865F2)
        .addFields(
          { name: 'Member Profile', value: `Mention: <@${member.id}>\nUsername: \`${member.user.username}\``, inline: true },
          { name: 'Created At', value: creationDateString, inline: true },
          { name: 'Server Statistics', value: `Total Members: \`${guild.memberCount}\``, inline: false }
        )
        .setTimestamp();
        
      if (settings.thumbnail) {
        embed.setThumbnail(settings.thumbnail === 'user' ? member.user.displayAvatarURL() : settings.thumbnail);
      }
      if (settings.banner) embed.setImage(settings.banner);
      else if (settings.image) embed.setImage(settings.image);
      
      // Component V2 Buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('welcome_invite_info')
          .setLabel('Invite Friends')
          .setEmoji(verifyEmoji)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('welcome_rewards_panel')
          .setLabel('Rewards Panel')
          .setEmoji(giftEmoji)
          .setStyle(ButtonStyle.Success)
      );
      
      await channel.send({ content: `<@${member.id}>`, embeds: [embed], components: [row] });
    } catch (error) {
      logger.error('Error executing guildMemberAdd welcome logic:', error);
    }
  }
};

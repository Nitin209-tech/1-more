const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Reward = require('../../../models/Reward');
const { getEmoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('togglereward')
    .setDescription('Toggle the status (Active/Inactive) of a reward (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
      option.setName('name')
        .setDescription('Exact name of the reward to toggle')
        .setRequired(true)
    ),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    
    const guildId = interaction.guildId;
    const successEmoji = await getEmoji(guildId, 'success');
    const errorEmoji = await getEmoji(guildId, 'error');
    
    try {
      const reward = await Reward.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!reward) {
        return interaction.reply({ content: `${errorEmoji} Reward named **${name}** not found in the database.`, ephemeral: true });
      }
      
      reward.isActive = !reward.isActive;
      await reward.save();
      
      const embed = new EmbedBuilder()
        .setTitle(`${successEmoji} Reward Status Updated`)
        .setColor(reward.isActive ? 0x55FF55 : 0xFF5555)
        .setDescription(`**${reward.name}** is now **${reward.isActive ? 'Active' : 'Inactive'}**.`)
        .addFields({ name: 'Current Status', value: reward.isActive ? 'Enabled (Visible to users)' : 'Disabled (Hidden from users)' })
        .setTimestamp();
        
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({ content: `${errorEmoji} Failed to toggle reward status: ${error.message}`, ephemeral: true });
    }
  }
};

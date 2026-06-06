const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Reward = require('../../../models/Reward');
const { getEmoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletereward')
    .setDescription('Delete an existing reward from the ecosystem (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
      option.setName('name')
        .setDescription('Exact name of the reward you want to delete')
        .setRequired(true)
    ),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    
    const guildId = interaction.guildId;
    const successEmoji = await getEmoji(guildId, 'success');
    const errorEmoji = await getEmoji(guildId, 'error');
    
    try {
      const result = await Reward.findOneAndDelete({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!result) {
        return interaction.reply({ content: `${errorEmoji} Reward named **${name}** not found in the database.`, ephemeral: true });
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`${successEmoji} Reward Deleted`)
        .setColor(0xFF5555)
        .setDescription(`Successfully removed **${name}** from the ecosystem.`)
        .setTimestamp();
        
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({ content: `${errorEmoji} Failed to delete reward: ${error.message}`, ephemeral: true });
    }
  }
};

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Reward = require('../../../models/Reward');
const { getEmoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editreward')
    .setDescription('Edit an existing reward (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
      option.setName('target_name')
        .setDescription('Exact name of the reward you want to edit')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('name')
        .setDescription('New name for the reward')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('New custom or animated Discord emoji')
        .setRequired(false)
    )
    .addIntegerOption(option => 
      option.setName('invites')
        .setDescription('New required invites count')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('description')
        .setDescription('New description for the reward')
        .setRequired(false)
    )
    .addIntegerOption(option => 
      option.setName('stock')
        .setDescription('New stock count')
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetName = interaction.options.getString('target_name');
    
    const guildId = interaction.guildId;
    const successEmoji = await getEmoji(guildId, 'success');
    const errorEmoji = await getEmoji(guildId, 'error');
    
    const reward = await Reward.findOne({ name: { $regex: new RegExp(`^${targetName}$`, 'i') } });
    if (!reward) {
      return interaction.reply({ content: `${errorEmoji} Reward named **${targetName}** not found in the database.`, ephemeral: true });
    }
    
    const newName = interaction.options.getString('name');
    const newEmoji = interaction.options.getString('emoji');
    const newInvites = interaction.options.getInteger('invites');
    const newDescription = interaction.options.getString('description');
    const newStock = interaction.options.getInteger('stock');
    
    if (newName) reward.name = newName;
    if (newEmoji) {
      const emojiRegex = /^<a?:[a-zA-Z0-9_]+:[0-9]+>$/;
      if (!emojiRegex.test(newEmoji)) {
        return interaction.reply({
          content: `${errorEmoji} Invalid emoji! You must provide a custom or animated Discord emoji format, e.g. \`<a:nitroboost:123456789012345678>\`.`,
          ephemeral: true
        });
      }
      reward.emoji = newEmoji;
    }
    if (newInvites !== null && newInvites !== undefined) reward.requiredInvites = newInvites;
    if (newDescription) reward.description = newDescription;
    if (newStock !== null && newStock !== undefined) reward.stock = newStock;
    
    try {
      await reward.save();
      
      const embed = new EmbedBuilder()
        .setTitle(`${successEmoji} Reward Updated Successfully`)
        .setColor(0x55FF55)
        .setDescription(`**${reward.name}** has been updated in the catalog.`)
        .addFields(
          { name: 'Emoji', value: reward.emoji, inline: true },
          { name: 'Required Invites', value: `\`${reward.requiredInvites}\``, inline: true },
          { name: 'Stock', value: `\`${reward.stock}\``, inline: true },
          { name: 'Description', value: reward.description }
        )
        .setTimestamp();
        
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({ content: `${errorEmoji} Failed to edit reward: ${error.message}`, ephemeral: true });
    }
  }
};

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Reward = require('../../../models/Reward');
const { getEmoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addreward')
    .setDescription('Add a new reward to the ecosystem (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
      option.setName('name')
        .setDescription('Name of the reward')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('Custom or animated Discord emoji (e.g. <a:nitro:123456>)')
        .setRequired(true)
    )
    .addIntegerOption(option => 
      option.setName('invites')
        .setDescription('Required invites to unlock')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('description')
        .setDescription('Brief description of the reward')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Reward category/type')
        .setRequired(true)
        .addChoices(
          { name: 'Discord Nitro', value: 'nitro' },
          { name: 'Robux Gift Card', value: 'robux' },
          { name: 'Custom Reward', value: 'custom' }
        )
    )
    .addIntegerOption(option => 
      option.setName('stock')
        .setDescription('Available stock quantity')
        .setRequired(false)
    ),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const emoji = interaction.options.getString('emoji');
    const invites = interaction.options.getInteger('invites');
    const description = interaction.options.getString('description');
    const type = interaction.options.getString('type');
    const stock = interaction.options.getInteger('stock') || 0;
    
    const guildId = interaction.guildId;
    const successEmoji = await getEmoji(guildId, 'success');
    const errorEmoji = await getEmoji(guildId, 'error');
    
    // Emoji validation regex (Discord custom or animated emoji format)
    const emojiRegex = /^<a?:[a-zA-Z0-9_]+:[0-9]+>$/;
    if (!emojiRegex.test(emoji)) {
      return interaction.reply({
        content: `${errorEmoji} Invalid emoji! In compliance with the global emoji rule, you must provide a custom or animated Discord emoji format, e.g. \`<a:nitroboost:123456789012345678>\`.`,
        ephemeral: true
      });
    }
    
    try {
      const newReward = new Reward({
        name,
        emoji,
        requiredInvites: invites,
        description,
        rewardType: type,
        stock,
        isActive: true
      });
      
      await newReward.save();
      
      const embed = new EmbedBuilder()
        .setTitle(`${successEmoji} Reward Added Successfully`)
        .setColor(0x55FF55)
        .setDescription(`**${name}** is now available in the reward selection catalog.`)
        .addFields(
          { name: 'Emoji', value: emoji, inline: true },
          { name: 'Required Invites', value: `\`${invites}\``, inline: true },
          { name: 'Type', value: `\`${type}\``, inline: true },
          { name: 'Stock', value: `\`${stock}\``, inline: true },
          { name: 'Description', value: description }
        )
        .setTimestamp();
        
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({ content: `${errorEmoji} Failed to save reward to database: ${error.message}`, ephemeral: true });
    }
  }
};

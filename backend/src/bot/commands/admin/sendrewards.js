const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getEmoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sendrewards')
    .setDescription('Send the Component V2 Rewards Center Panel to the current channel (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const guildId = interaction.guildId;
    
    // Emojis for buttons/embed
    const giftEmoji = await getEmoji(guildId, 'gift');
    const verifyEmoji = await getEmoji(guildId, 'verify');
    const nitroEmoji = await getEmoji(guildId, 'nitro');
    
    const embed = new EmbedBuilder()
      .setTitle(`${giftEmoji} Invite Rewards Center`)
      .setDescription(`Invite your friends and unlock amazing rewards!\n\nUse the buttons below to interact with the reward ecosystem:\n\n**${giftEmoji} Claim Reward:** Choose your reward if you have enough invites.\n**${verifyEmoji} Check Invites:** View your real-time invite stats (valid, leaves, fakes).\n**${nitroEmoji} View Rewards:** Browse all unlockable server rewards.`)
      .setColor(0x5865F2)
      .setFooter({ text: 'Invite Friends → Unlock Rewards' })
      .setTimestamp();
      
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('claim_reward_btn')
        .setLabel('Claim Reward')
        .setStyle(ButtonStyle.Success)
        .setEmoji(giftEmoji),
      new ButtonBuilder()
        .setCustomId('check_invites_btn')
        .setLabel('Check Invites')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(verifyEmoji),
      new ButtonBuilder()
        .setCustomId('view_rewards_btn')
        .setLabel('View Rewards')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(nitroEmoji)
    );
    
    await interaction.reply({ content: 'Reward panel sent.', ephemeral: true });
    return interaction.channel.send({ embeds: [embed], components: [row] });
  }
};

const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Claim = require('../../../models/Claim');
const Configuration = require('../../../models/Configuration');
const { getEmoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claimpanel')
    .setDescription('Send the staff action panel in the current channel (Staff only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const channelId = interaction.channel.id;
    const guildId = interaction.guildId;
    
    const successEmoji = await getEmoji(guildId, 'success');
    const errorEmoji = await getEmoji(guildId, 'error');
    const verifyEmoji = await getEmoji(guildId, 'verify');
    
    // Check if channel is registered for a claim
    const claim = await Claim.findOne({ channelId });
    if (!claim) {
      return interaction.reply({ content: `${errorEmoji} This channel is not registered as an active claim ticket.`, ephemeral: true });
    }
    
    // Check if user is staff
    const config = await Configuration.findOne({ guildId }) || new Configuration({ guildId });
    const staffRoleId = config.staffRole || process.env.STAFF_ROLE_ID;
    
    if (staffRoleId && !interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: `${errorEmoji} Only staff members can trigger this panel.`, ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`Staff Action Center - Claim \`${claim.claimId}\``)
      .setDescription(`Use the buttons below to process this reward claim:\n\n**Approve:** Authorize and log reward issuance.\n**Reject:** Decline claim (reasons required via modal).\n**Close:** Complete claim and archive ticket channel.\n**Delete:** Delete this ticket channel permanently.`)
      .setColor(0x5865F2)
      .addFields(
        { name: 'Claimant', value: `<@${claim.discordId}>`, inline: true },
        { name: 'Selected Reward', value: claim.rewardName, inline: true },
        { name: 'Invites Verified', value: `\`${claim.inviteCount}\``, inline: true }
      )
      .setTimestamp();
      
    const staffRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`staff_approve_${claim._id}`).setLabel('Approve').setStyle(ButtonStyle.Success).setEmoji(successEmoji),
      new ButtonBuilder().setCustomId(`staff_reject_${claim._id}`).setLabel('Reject').setStyle(ButtonStyle.Danger).setEmoji(errorEmoji),
      new ButtonBuilder().setCustomId(`staff_close_${claim._id}`).setLabel('Close').setStyle(ButtonStyle.Primary).setEmoji(verifyEmoji),
      new ButtonBuilder().setCustomId(`staff_delete_${claim._id}`).setLabel('Delete').setStyle(ButtonStyle.Secondary).setEmoji(errorEmoji)
    );
    
    return interaction.reply({ embeds: [embed], components: [staffRow] });
  }
};

const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} = require('discord.js');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Reward = require('../../models/Reward');
const Claim = require('../../models/Claim');
const Configuration = require('../../models/Configuration');
const Log = require('../../models/Log');
const logger = require('../../utils/logger');
const { getEmoji } = require('../utils/emojis');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    const guildId = interaction.guildId || process.env.GUILD_ID;
    
    // 1. Slash Commands Routing
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        logger.error(`Error executing slash command ${interaction.commandName}:`, error);
        const errEmoji = await getEmoji(guildId, 'error');
        const replyPayload = { content: `${errEmoji} There was an error while executing this command!`, ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload);
        } else {
          await interaction.reply(replyPayload);
        }
      }
      return;
    }
    
    // 2. Button Interactions Routing
    if (interaction.isButton()) {
      try {
        await handleButtonInteraction(interaction);
      } catch (error) {
        logger.error(`Error handling button interaction ${interaction.customId}:`, error);
      }
      return;
    }
    
    // 3. Select Menu Interactions Routing
    if (interaction.isStringSelectMenu()) {
      try {
        await handleSelectMenuInteraction(interaction);
      } catch (error) {
        logger.error(`Error handling select menu interaction ${interaction.customId}:`, error);
      }
      return;
    }
    
    // 4. Modal Submissions Routing
    if (interaction.isModalSubmit()) {
      try {
        await handleModalSubmission(interaction);
      } catch (error) {
        logger.error(`Error handling modal submission ${interaction.customId}:`, error);
      }
      return;
    }
  }
};

/**
 * Handle all button actions
 */
async function handleButtonInteraction(interaction) {
  const { customId, guild, user, client } = interaction;
  const guildId = guild?.id || process.env.GUILD_ID;
  
  // Custom Emojis
  const loadingEmoji = await getEmoji(guildId, 'loading');
  const verifyEmoji = await getEmoji(guildId, 'verify');
  const successEmoji = await getEmoji(guildId, 'success');
  const errorEmoji = await getEmoji(guildId, 'error');
  const giftEmoji = await getEmoji(guildId, 'gift');
  const nitroEmoji = await getEmoji(guildId, 'nitro');
  const robuxEmoji = await getEmoji(guildId, 'robux');
  
  // Welcome buttons
  if (customId === 'welcome_invite_info') {
    return interaction.reply({
      content: `${giftEmoji} **How to Invite Friends:**\n1. Click your server name and select **Invite People**.\n2. Set the link to **Never Expire**.\n3. Share the link with friends to start earning rewards!`,
      ephemeral: true
    });
  }
  
  if (customId === 'welcome_rewards_panel') {
    const rewards = await Reward.find({ isActive: true });
    if (rewards.length === 0) {
      return interaction.reply({ content: `${errorEmoji} No rewards are currently configured.`, ephemeral: true });
    }
    const rewardList = rewards.map(r => `${r.emoji} **${r.name}** - Requires \`${r.requiredInvites}\` invites`).join('\n');
    return interaction.reply({
      content: `${giftEmoji} **Available Invite Rewards:**\n\n${rewardList}`,
      ephemeral: true
    });
  }

  // Reward Panel buttons
  if (customId === 'claim_reward_btn') {
    // Open select menu dropdown
    const rewards = await Reward.find({ isActive: true });
    if (rewards.length === 0) {
      return interaction.reply({ content: `${errorEmoji} No rewards are currently available for claiming.`, ephemeral: true });
    }
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_reward_menu')
      .setPlaceholder('Select Your Reward')
      .addOptions(
        rewards.map(r => ({
          label: r.name,
          description: `Requires ${r.requiredInvites} invites: ${r.description.slice(0, 50)}`,
          value: r._id.toString(),
          emoji: r.emoji.includes(':') ? r.emoji.split(':')[1] : undefined
        }))
      );
      
    const row = new ActionRowBuilder().addComponents(selectMenu);
    return interaction.reply({
      content: `${giftEmoji} Please choose your reward from the dropdown below:`,
      components: [row],
      ephemeral: true
    });
  }
  
  if (customId === 'check_invites_btn') {
    let userProfile = await User.findOne({ discordId: user.id });
    if (!userProfile) {
      userProfile = new User({ discordId: user.id, username: user.username });
      await userProfile.save();
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`${verifyEmoji} Your Invite Statistics`)
      .setColor(0x5865F2)
      .setDescription(`Invite friends to unlock Discord Nitro and Robux Gift Cards!`)
      .addFields(
        { name: 'Total Invites', value: `\`${userProfile.invites.total}\``, inline: true },
        { name: 'Valid Invites', value: `\`${userProfile.invites.valid}\``, inline: true },
        { name: 'Fake Invites', value: `\`${userProfile.invites.fake}\``, inline: true },
        { name: 'Leaves', value: `\`${userProfile.invites.leaves}\``, inline: true },
        { name: 'Rejoins', value: `\`${userProfile.invites.rejoins}\``, inline: true },
        { name: 'Bonus Invites', value: `\`${userProfile.invites.bonus}\``, inline: true },
        { name: 'Net Invites (Valid + Bonus)', value: `**\`${userProfile.invites.valid + userProfile.invites.bonus}\`**`, inline: false }
      )
      .setTimestamp();
      
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  if (customId === 'view_rewards_btn') {
    const rewards = await Reward.find({ isActive: true });
    if (rewards.length === 0) {
      return interaction.reply({ content: `${errorEmoji} No rewards are currently configured.`, ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`${giftEmoji} Server Rewards Ecosystem`)
      .setDescription('Invite friends to unlock premium rewards instantly.')
      .setColor(0x5865F2);
      
    rewards.forEach(r => {
      embed.addFields({
        name: `${r.emoji} ${r.name}`,
        value: `Required Invites: \`${r.requiredInvites}\`\nDescription: ${r.description}\nStock: \`${r.stock}\``,
        inline: false
      });
    });
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  // DM Confirmation screen button clicks
  if (customId.startsWith('claim_continue_')) {
    const claimDbId = customId.split('claim_continue_')[1];
    await interaction.deferUpdate();
    
    // Look up claim details
    const claim = await Claim.findById(claimDbId);
    if (!claim) {
      return interaction.followUp({ content: `${errorEmoji} Claim session not found. Please try again.`, ephemeral: true });
    }
    
    // Duplicate Check: Check if user already has an active claim channel
    const config = await Configuration.findOne({ guildId }) || new Configuration({ guildId });
    const targetGuild = client.guilds.cache.get(guildId);
    if (!targetGuild) {
      return interaction.followUp({ content: `${errorEmoji} Discord server not found.`, ephemeral: true });
    }
    
    const existingClaim = await Claim.findOne({
      discordId: user.id,
      status: { $in: ['Pending', 'Processing'] },
      channelId: { $ne: null }
    });
    
    if (existingClaim) {
      // Reopen existing channel
      const existingChannel = targetGuild.channels.cache.get(existingClaim.channelId);
      if (existingChannel) {
        // Send DM link to existing channel
        const embed = new EmbedBuilder()
          .setTitle(`${errorEmoji} Duplicate Claim Detected`)
          .setDescription(`You already have an active claim ticket. We have reopened it for you: <#${existingChannel.id}>`)
          .setColor(0xFF5555);
        return interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    }
    
    // Generate private channel name
    const prefix = config.claimChannelPrefix || 'claim-';
    const channelName = `${prefix}${user.id}`;
    
    // Build permission overwrites
    const permissionOverwrites = [
      {
        id: targetGuild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: client.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageChannels]
      }
    ];
    
    // Add staff permissions
    const staffRoleId = config.staffRole || process.env.STAFF_ROLE_ID;
    if (staffRoleId && targetGuild.roles.cache.has(staffRoleId)) {
      permissionOverwrites.push({
        id: staffRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
      });
    }
    
    // Add claimant permissions if allowed
    const allowClaimant = config.allowClaimantAccess ?? true;
    if (allowClaimant) {
      permissionOverwrites.push({
        id: user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
      });
    }
    
    let claimCategory = config.claimCategory || process.env.CLAIM_CATEGORY_ID;
    if (claimCategory === '123456789012345678') claimCategory = null; // ignore default placeholders
    
    try {
      const channel = await targetGuild.channels.create({
        name: channelName,
        type: 0, // GuildText
        parent: claimCategory || undefined,
        permissionOverwrites
      });
      
      claim.channelId = channel.id;
      claim.status = 'Pending';
      await claim.save();
      
      // Auto Claim Log in private channel
      const logEmbed = new EmbedBuilder()
        .setTitle(`${successEmoji} Claim Ticket Created`)
        .setColor(0x5865F2)
        .addFields(
          { name: 'Claim ID', value: `\`${claim.claimId}\``, inline: true },
          { name: 'User', value: `<@${user.id}> (${user.username})`, inline: true },
          { name: 'Selected Reward', value: claim.rewardName, inline: true },
          { name: 'Invite Count', value: `\`${claim.inviteCount}\``, inline: true },
          { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: 'Verification Status', value: `\`Pending Survey\``, inline: true }
        )
        .setTimestamp();
        
      // Embed sent to the channel
      await channel.send({ embeds: [logEmbed] });
      
      // Create Staff panel inside claim channel
      const staffRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`staff_approve_${claim._id}`).setLabel('Approve').setStyle(ButtonStyle.Success).setEmoji(successEmoji),
        new ButtonBuilder().setCustomId(`staff_reject_${claim._id}`).setLabel('Reject').setStyle(ButtonStyle.Danger).setEmoji(errorEmoji),
        new ButtonBuilder().setCustomId(`staff_close_${claim._id}`).setLabel('Close').setStyle(ButtonStyle.Primary).setEmoji(verifyEmoji),
        new ButtonBuilder().setCustomId(`staff_delete_${claim._id}`).setLabel('Delete').setStyle(ButtonStyle.Secondary).setEmoji(errorEmoji)
      );
      await channel.send({ content: `**Staff Claim Management Options:**`, components: [staffRow] });
      
      // Generate secure JWT Session for Frontend Web Survey
      const token = jwt.sign(
        { 
          userId: user.id, 
          claimId: claim.claimId, 
          rewardName: claim.rewardName 
        },
        process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_me_in_production',
        { expiresIn: '1h' }
      );
      
      // Link user to Next.js survey flow
      const websiteUrl = `${process.env.WEBSITE_URL || 'http://localhost:3000'}/claim?token=${token}`;
      
      const successDM = new EmbedBuilder()
        .setTitle(`${verifyEmoji} Claim Ticket Created!`)
        .setDescription(`Your claim channel is now open: <#${channel.id}>\n\nTo complete your claim, you **must complete the verification survey** on our secure web platform.`)
        .setColor(0x55FF55)
        .setTimestamp();
        
      const linkRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Complete Survey Verification')
          .setStyle(ButtonStyle.Link)
          .setEmoji(successEmoji)
          .setURL(websiteUrl)
      );
      
      await interaction.followUp({ embeds: [successDM], components: [linkRow], ephemeral: true });
    } catch (err) {
      logger.error('Failed to create claim channel:', err);
      await interaction.followUp({ content: `${errorEmoji} Failed to create claim ticket. Please contact staff directly.`, ephemeral: true });
    }
  }
  
  if (customId.startsWith('claim_change_reward_')) {
    await interaction.deferUpdate();
    // Re-prompt selection
    const rewards = await Reward.find({ isActive: true });
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_reward_menu')
      .setPlaceholder('Select Your Reward')
      .addOptions(
        rewards.map(r => ({
          label: r.name,
          description: `Requires ${r.requiredInvites} invites`,
          value: r._id.toString(),
          emoji: r.emoji.includes(':') ? r.emoji.split(':')[1] : undefined
        }))
      );
      
    const row = new ActionRowBuilder().addComponents(selectMenu);
    return interaction.followUp({
      content: `${giftEmoji} Please choose your new reward:`,
      components: [row],
      ephemeral: true
    });
  }
  
  // Staff buttons logic
  if (customId.startsWith('staff_')) {
    // Check if staff role is present
    const member = await guild.members.fetch(user.id);
    const config = await Configuration.findOne({ guildId }) || new Configuration({ guildId });
    const staffRoleId = config.staffRole || process.env.STAFF_ROLE_ID;
    
    if (staffRoleId && !member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: `${errorEmoji} Staff only.`, ephemeral: true });
    }
    
    const action = customId.split('staff_')[1].split('_')[0];
    const claimDbId = customId.split('staff_')[1].split('_')[1];
    
    const claim = await Claim.findById(claimDbId);
    if (!claim) {
      return interaction.reply({ content: `${errorEmoji} Claim not found in database.`, ephemeral: true });
    }
    
    if (action === 'approve') {
      claim.status = 'Approved';
      await claim.save();
      
      const successEmbed = new EmbedBuilder()
        .setTitle(`${successEmoji} Claim Approved`)
        .setColor(0x55FF55)
        .setDescription(`Staff member <@${user.id}> has approved this claim.`)
        .addFields({ name: 'Claim ID', value: `\`${claim.claimId}\`` })
        .setTimestamp();
        
      await interaction.reply({ embeds: [successEmbed] });
      
      // Attempt DMing user
      try {
        const claimant = await client.users.fetch(claim.discordId);
        const dmEmbed = new EmbedBuilder()
          .setTitle(`${successEmoji} Claim Approved!`)
          .setDescription(`Your claim for **${claim.rewardName}** (ID: \`${claim.claimId}\`) has been **approved** by staff. Please check the ticket channel or wait for a staff member to send details.`)
          .setColor(0x55FF55)
          .setTimestamp();
        await claimant.send({ embeds: [dmEmbed] });
      } catch (err) {
        logger.warn(`Could not DM claimant ${claim.discordId}: ${err.message}`);
      }
    } 
    
    else if (action === 'reject') {
      // Trigger a Modal to input rejection reason
      const modal = new ModalBuilder()
        .setCustomId(`reject_modal_${claim._id}`)
        .setTitle('Reject Claim Reason');
        
      const reasonInput = new TextInputBuilder()
        .setCustomId('reject_reason')
        .setLabel('Rejection Reason')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter reason here...')
        .setRequired(true);
        
      const row = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(row);
      await interaction.showModal(modal);
    } 
    
    else if (action === 'close') {
      claim.status = 'Completed';
      await claim.save();
      
      const closeEmbed = new EmbedBuilder()
        .setTitle(`${verifyEmoji} Claim Closed`)
        .setColor(0x99AAB5)
        .setDescription(`This ticket has been completed and marked as closed by <@${user.id}>.`)
        .setTimestamp();
        
      await interaction.reply({ embeds: [closeEmbed] });
      
      // Move to completed category if set
      let completedCatId = config.completedCategory || process.env.COMPLETED_CLAIM_CATEGORY_ID;
      if (completedCatId === '123456789012345678') completedCatId = null;
      
      if (completedCatId && guild.channels.cache.has(completedCatId)) {
        await interaction.channel.setParent(completedCatId, { lockPermissions: false });
        await interaction.channel.permissionOverwrites.edit(claim.discordId, {
          ViewChannel: false
        });
      }
    } 
    
    else if (action === 'delete') {
      await interaction.reply({ content: `${loadingEmoji} Deleting channel in 5 seconds...` });
      
      // Remove db reference channelId
      claim.channelId = null;
      await claim.save();
      
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (e) {
          logger.error('Failed to delete channel:', e);
        }
      }, 5000);
    }
  }
}

/**
 * Handle select menu selections
 */
async function handleSelectMenuInteraction(interaction) {
  const { customId, values, user, guildId, client } = interaction;
  
  if (customId === 'select_reward_menu') {
    await interaction.deferUpdate();
    
    const rewardId = values[0];
    const reward = await Reward.findById(rewardId);
    
    const errorEmoji = await getEmoji(guildId, 'error');
    const loadingEmoji = await getEmoji(guildId, 'loading');
    const successEmoji = await getEmoji(guildId, 'success');
    const verifyEmoji = await getEmoji(guildId, 'verify');
    
    if (!reward) {
      return interaction.followUp({ content: `${errorEmoji} Selected reward was not found.`, ephemeral: true });
    }
    
    // DM step 1: Request received and verification initialized
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`${verifyEmoji} Thank You For Inviting Friends`)
        .setDescription(`Thank you for supporting our community.\n\nYour reward request for **${reward.name}** has been received.\nWe are now verifying your invites. Please wait...`)
        .setColor(0x5865F2)
        .setTimestamp();
        
      const dmChannel = await user.createDM();
      await dmChannel.send({ embeds: [dmEmbed] });
      
      // Wait 10 seconds (Checking Invites)
      setTimeout(async () => {
        try {
          // Send checking invites message
          const checkEmbed = new EmbedBuilder()
            .setTitle(`${loadingEmoji} Checking Your Invites`)
            .setDescription(`We are currently scanning the guild invites list. Please hold...`)
            .setColor(0xFFAA00);
          
          const checkingMsg = await dmChannel.send({ embeds: [checkEmbed] });
          
          // Perform invite checks in database
          let userProfile = await User.findOne({ discordId: user.id });
          if (!userProfile) {
            userProfile = new User({ discordId: user.id, username: user.username });
            await userProfile.save();
          }
          
          const netInvites = userProfile.invites.valid + userProfile.invites.bonus;
          const required = reward.requiredInvites;
          const qualified = netInvites >= required;
          
          // Update message
          const statusText = qualified ? `Qualified` : `Insufficient Invites (\`${netInvites}/${required}\`)`;
          
          const resultEmbed = new EmbedBuilder()
            .setTitle(qualified ? `${successEmoji} Verification Successful` : `${errorEmoji} Verification Failed`)
            .setColor(qualified ? 0x55FF55 : 0xFF5555)
            .addFields(
              { name: 'Current Invites', value: `\`${netInvites}\``, inline: true },
              { name: 'Required Invites', value: `\`${required}\``, inline: true },
              { name: 'Verification Status', value: `**\`${statusText}\`**`, inline: true }
            )
            .setTimestamp();
            
          await checkingMsg.edit({ embeds: [resultEmbed] });
          
          if (qualified) {
            // Generate clean Claim ID
            const claimId = `CLM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            // Store Pending Claim in MongoDB
            const claim = new Claim({
              claimId,
              discordId: user.id,
              username: user.username,
              rewardId: reward._id,
              rewardName: reward.name,
              inviteCount: netInvites,
              status: 'Pending'
            });
            await claim.save();
            
            const qualifyEmbed = new EmbedBuilder()
              .setTitle(`${verifyEmoji} Reward Verification Complete`)
              .setDescription(`You qualify for **${reward.name}**!\nClick **Continue** to create a private claim ticket channel in the Discord server, or click **Change Reward** to choose a different reward.`)
              .setColor(0x55FF55)
              .setTimestamp();
              
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`claim_continue_${claim._id}`)
                .setLabel('Continue')
                .setStyle(ButtonStyle.Success)
                .setEmoji(successEmoji),
              new ButtonBuilder()
                .setCustomId(`claim_change_reward_${claim._id}`)
                .setLabel('Change Reward')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(verifyEmoji)
            );
            
            await dmChannel.send({ embeds: [qualifyEmbed], components: [row] });
          } else {
            // Send failure warning
            const failInfoEmbed = new EmbedBuilder()
              .setTitle(`${errorEmoji} Reward Locked`)
              .setDescription(`You need \`${required - netInvites}\` more valid invites to unlock **${reward.name}**.\n\nKeep sharing your invite links to unlock this reward!`)
              .setColor(0xFF5555);
            await dmChannel.send({ embeds: [failInfoEmbed] });
          }
        } catch (e) {
          logger.error('Error during invite verification delay:', e);
        }
      }, 10000);
      
    } catch (e) {
      logger.error('Could not send DM to user:', e);
      return interaction.followUp({ content: `${errorEmoji} I could not send you DMs. Please verify that your DMs are open!`, ephemeral: true });
    }
  }
}

/**
 * Handle modal inputs (e.g. rejection reasons)
 */
async function handleModalSubmission(interaction) {
  const { customId, fields, user } = interaction;
  
  if (customId.startsWith('reject_modal_')) {
    const claimDbId = customId.split('reject_modal_')[1];
    const reason = fields.getTextInputValue('reject_reason');
    
    const claim = await Claim.findById(claimDbId);
    if (!claim) {
      return interaction.reply({ content: `Claim not found in database.`, ephemeral: true });
    }
    
    claim.status = 'Rejected';
    claim.rejectReason = reason;
    await claim.save();
    
    const errorEmoji = await getEmoji(interaction.guildId, 'error');
    
    const rejectEmbed = new EmbedBuilder()
      .setTitle(`${errorEmoji} Claim Rejected`)
      .setColor(0xFF5555)
      .setDescription(`Staff member <@${user.id}> has rejected this claim.`)
      .addFields(
        { name: 'Claim ID', value: `\`${claim.claimId}\`` },
        { name: 'Reason', value: `\`${reason}\`` }
      )
      .setTimestamp();
      
    await interaction.reply({ embeds: [rejectEmbed] });
    
    // Attempt DMing user
    try {
      const claimant = await interaction.client.users.fetch(claim.discordId);
      const dmEmbed = new EmbedBuilder()
        .setTitle(`${errorEmoji} Claim Rejected`)
        .setDescription(`Your claim for **${claim.rewardName}** (ID: \`${claim.claimId}\`) has been **rejected**.\n\n**Reason:** ${reason}`)
        .setColor(0xFF5555)
        .setTimestamp();
      await claimant.send({ embeds: [dmEmbed] });
    } catch (err) {
      logger.warn(`Could not DM claimant ${claim.discordId}: ${err.message}`);
    }
  }
}

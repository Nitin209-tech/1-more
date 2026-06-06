const { EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const Invite = require('../../models/Invite');
const Configuration = require('../../models/Configuration');
const Log = require('../../models/Log');
const logger = require('../../utils/logger');
const { getEmoji } = require('../utils/emojis');

/**
 * Initialize invite cache for all guilds the client is in.
 */
const initInviteTracker = async (client) => {
  logger.info('Initializing invite tracker cache...');
  
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      // Check for permission to manage/read invites
      const botMember = guild.members.me;
      if (!botMember || !botMember.permissions.has('ManageGuild')) {
        logger.warn(`Bot lacks 'Manage Guild' permission in server: ${guild.name} (${guildId}). Invite tracking might fail.`);
        continue;
      }
      
      const invites = await guild.invites.fetch();
      const guildInvites = new Map();
      
      for (const [code, invite] of invites) {
        guildInvites.set(code, invite.uses);
        
        // Sync invite to MongoDB
        await Invite.findOneAndUpdate(
          { code },
          {
            code,
            guildId,
            inviterId: invite.inviter?.id || 'VANITY',
            uses: invite.uses,
            maxUses: invite.maxUses || 0,
            expiresAt: invite.expiresAt ? new Date(invite.expiresAt) : null
          },
          { upsert: true, new: true }
        );
      }
      
      client.invites.set(guildId, guildInvites);
      logger.info(`Cached ${guildInvites.size} invites for guild: ${guild.name}`);
    } catch (error) {
      logger.error(`Error caching invites for guild ${guildId}:`, error);
    }
  }
};

/**
 * Handle new member join. Detects which invite was used.
 */
const trackMemberJoin = async (member) => {
  const guild = member.guild;
  const client = member.client;
  
  try {
    const config = await Configuration.findOne({ guildId: guild.id }) || new Configuration({ guildId: guild.id });
    
    // Check permissions
    const botMember = guild.members.me;
    if (!botMember || !botMember.permissions.has('ManageGuild')) {
      logger.warn(`Lacking Manage Guild permission in ${guild.name}, cannot track join.`);
      return;
    }
    
    // Fetch fresh invites
    const freshInvites = await guild.invites.fetch();
    const cachedInvites = client.invites.get(guild.id) || new Map();
    
    let usedInvite = null;
    
    // Compare
    for (const [code, invite] of freshInvites) {
      const cachedUses = cachedInvites.get(code);
      if (cachedUses !== undefined && invite.uses > cachedUses) {
        usedInvite = invite;
        break;
      } else if (cachedUses === undefined && invite.uses > 0) {
        // New invite that has been used
        usedInvite = invite;
        break;
      }
    }
    
    // Update cache
    const newCache = new Map();
    for (const [code, invite] of freshInvites) {
      newCache.set(code, invite.uses);
      
      // Update DB copy
      await Invite.findOneAndUpdate(
        { code },
        {
          code,
          guildId: guild.id,
          inviterId: invite.inviter?.id || 'VANITY',
          uses: invite.uses,
          maxUses: invite.maxUses || 0,
          expiresAt: invite.expiresAt ? new Date(invite.expiresAt) : null
        },
        { upsert: true }
      );
    }
    client.invites.set(guild.id, newCache);
    
    if (!usedInvite) {
      logger.info(`Member ${member.user.tag} joined but no matching invite was found (could be vanity URL or bot integration).`);
      return;
    }
    
    const inviter = usedInvite.inviter;
    if (!inviter) {
      logger.info(`Member joined using code ${usedInvite.code} but creator is anonymous/unknown.`);
      return;
    }
    
    const inviterId = inviter.id;
    const inviteeId = member.id;
    
    // 1. Abuse Checks: Self-Invite
    if (inviteeId === inviterId) {
      logger.info(`User ${member.user.tag} joined using their own invite code ${usedInvite.code}. No rewards granted.`);
      await logToDB('INVITE_JOIN', inviteeId, member.user.username, {
        code: usedInvite.code,
        status: 'Self-Invite',
        inviterId
      });
      return;
    }
    
    // 2. Abuse Checks: Alt Account Detection
    const accountAgeDays = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
    const minAgeDays = config.minAccountAgeDays || 7;
    const isAlt = accountAgeDays < minAgeDays;
    
    // Get inviter's DB profile
    let inviterProfile = await User.findOne({ discordId: inviterId });
    if (!inviterProfile) {
      inviterProfile = new User({ discordId: inviterId, username: inviter.username });
    }
    
    // Check if this invitee already exists in the database
    let inviteeProfile = await User.findOne({ discordId: inviteeId });
    let isRejoin = false;
    
    if (inviteeProfile) {
      isRejoin = true;
      inviteeProfile.username = member.user.username;
      inviteeProfile.avatar = member.user.displayAvatarURL();
    } else {
      inviteeProfile = new User({
        discordId: inviteeId,
        username: member.user.username,
        avatar: member.user.displayAvatarURL(),
        invitedBy: inviterId,
        isAlt
      });
    }
    
    await inviteeProfile.save();
    
    // Update inviter metrics
    if (isRejoin) {
      // Rejoin logic:
      // If they were invited by the SAME inviter previously
      if (inviteeProfile.invitedBy === inviterId) {
        inviterProfile.invites.rejoins += 1;
        // Decrement leaves (since they had left and now came back)
        if (inviterProfile.invites.leaves > 0) {
          inviterProfile.invites.leaves -= 1;
        }
        // Increment valid back
        inviterProfile.invites.valid += 1;
      } else {
        // Joining again but with a different inviter? Or reset inviter
        const oldInviterId = inviteeProfile.invitedBy;
        inviteeProfile.invitedBy = inviterId;
        await inviteeProfile.save();
        
        // Decrement old inviter's list if appropriate, or just keep it simple:
        // Increment new inviter's invites
        if (isAlt) {
          inviterProfile.invites.fake += 1;
        } else {
          inviterProfile.invites.valid += 1;
          inviterProfile.invites.total += 1;
        }
        if (!inviterProfile.invitedUsers.includes(inviteeId)) {
          inviterProfile.invitedUsers.push(inviteeId);
        }
      }
    } else {
      // Completely new join
      if (isAlt) {
        inviterProfile.invites.fake += 1;
      } else {
        inviterProfile.invites.valid += 1;
        inviterProfile.invites.total += 1;
      }
      if (!inviterProfile.invitedUsers.includes(inviteeId)) {
        inviterProfile.invitedUsers.push(inviteeId);
      }
    }
    
    await inviterProfile.save();
    
    // Log to DB
    await logToDB('INVITE_JOIN', inviteeId, member.user.username, {
      code: usedInvite.code,
      inviterId,
      isAlt,
      isRejoin,
      accountAgeDays
    });
    
    // Log in Discord server channel if configured
    if (config.logChannel) {
      const channel = guild.channels.cache.get(config.logChannel);
      if (channel) {
        const verifyEmoji = await getEmoji(guild.id, isAlt ? 'error' : 'success');
        const joinEmoji = await getEmoji(guild.id, 'verify');
        
        const embed = new EmbedBuilder()
          .setTitle(`${joinEmoji} Member Joined`)
          .setColor(isAlt ? 0xFF5555 : 0x55FF55)
          .setDescription(`**${member.user.tag}** joined the server.`)
          .addFields(
            { name: 'Inviter', value: `<@${inviterId}> (${inviter.tag})`, inline: true },
            { name: 'Invite Code', value: `\`${usedInvite.code}\``, inline: true },
            { name: 'Alt Account?', value: `${verifyEmoji} ${isAlt ? 'Yes (Under 7 Days Old)' : 'No'}`, inline: true },
            { name: 'Inviter Stats', value: `Total: \`${inviterProfile.invites.total}\` | Valid: \`${inviterProfile.invites.valid}\` | Fake: \`${inviterProfile.invites.fake}\` | Left: \`${inviterProfile.invites.leaves}\`` }
          )
          .setTimestamp();
          
        await channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    logger.error('Error tracking member join:', error);
  }
};

/**
 * Handle member leaving.
 */
const trackMemberLeave = async (member) => {
  const guild = member.guild;
  
  try {
    const config = await Configuration.findOne({ guildId: guild.id });
    const inviteeProfile = await User.findOne({ discordId: member.id });
    
    if (inviteeProfile && inviteeProfile.invitedBy) {
      const inviterId = inviteeProfile.invitedBy;
      
      const inviterProfile = await User.findOne({ discordId: inviterId });
      if (inviterProfile) {
        inviterProfile.invites.leaves += 1;
        if (inviterProfile.invites.valid > 0) {
          inviterProfile.invites.valid -= 1;
        }
        await inviterProfile.save();
        
        // Log to DB
        await logToDB('INVITE_LEAVE', member.id, member.user.username, {
          inviterId
        });
        
        // Log in Discord log channel
        if (config && config.logChannel) {
          const channel = guild.channels.cache.get(config.logChannel);
          if (channel) {
            const errorEmoji = await getEmoji(guild.id, 'error');
            const embed = new EmbedBuilder()
              .setTitle(`${errorEmoji} Member Left`)
              .setColor(0xFFAA00)
              .setDescription(`**${member.user.tag}** left the server.`)
              .addFields(
                { name: 'Inviter', value: `<@${inviterId}>`, inline: true },
                { name: 'Inviter Stats', value: `Total: \`${inviterProfile.invites.total}\` | Valid: \`${inviterProfile.invites.valid}\` | Left: \`${inviterProfile.invites.leaves}\`` }
              )
              .setTimestamp();
              
            await channel.send({ embeds: [embed] });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error tracking member leave:', error);
  }
};

/**
 * Update invite cache on new invite code generation.
 */
const trackInviteCreate = async (invite) => {
  try {
    const client = invite.client;
    const guildId = invite.guild.id;
    
    let guildInvites = client.invites.get(guildId);
    if (!guildInvites) {
      guildInvites = new Map();
      client.invites.set(guildId, guildInvites);
    }
    
    guildInvites.set(invite.code, invite.uses);
    logger.info(`Invite code created: ${invite.code} in ${invite.guild.name}`);
    
    // Sync to DB
    await Invite.findOneAndUpdate(
      { code: invite.code },
      {
        code: invite.code,
        guildId,
        inviterId: invite.inviter?.id || 'VANITY',
        uses: invite.uses,
        maxUses: invite.maxUses || 0,
        expiresAt: invite.expiresAt ? new Date(invite.expiresAt) : null
      },
      { upsert: true }
    );
  } catch (error) {
    logger.error('Error tracking invite create:', error);
  }
};

/**
 * Clean up invite cache on invite deletion.
 */
const trackInviteDelete = async (invite) => {
  try {
    const client = invite.client;
    const guildId = invite.guild.id;
    
    const guildInvites = client.invites.get(guildId);
    if (guildInvites) {
      guildInvites.delete(invite.code);
    }
    
    logger.info(`Invite code deleted: ${invite.code} in ${invite.guild.name}`);
    
    // Delete from DB
    await Invite.deleteOne({ code: invite.code });
  } catch (error) {
    logger.error('Error tracking invite delete:', error);
  }
};

/**
 * Log action helper.
 */
const logToDB = async (type, userId, username, details) => {
  try {
    const auditLog = new Log({
      type,
      userId,
      username,
      details
    });
    await auditLog.save();
  } catch (error) {
    logger.error('Error logging to DB:', error);
  }
};

module.exports = {
  initInviteTracker,
  trackMemberJoin,
  trackMemberLeave,
  trackInviteCreate,
  trackInviteDelete
};

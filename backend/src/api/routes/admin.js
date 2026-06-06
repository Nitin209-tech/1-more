const express = require('express');
const { EmbedBuilder } = require('discord.js');
const Claim = require('../../models/Claim');
const User = require('../../models/User');
const Log = require('../../models/Log');
const Reward = require('../../models/Reward');
const Configuration = require('../../models/Configuration');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { emitToUser } = require('./notifications');
const client = require('../../bot/client');
const logger = require('../../utils/logger');
const { getEmoji } = require('../../bot/utils/emojis');

const router = express.Router();

// Admin protection middleware helper
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied: Admin permissions required.' });
  }
  next();
};

// 1. Analytics & Statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalClaims = await Claim.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: 'Pending' });
    const processingClaims = await Claim.countDocuments({ status: 'Processing' });
    const approvedClaims = await Claim.countDocuments({ status: 'Approved' });
    const rejectedClaims = await Claim.countDocuments({ status: 'Rejected' });
    const completedClaims = await Claim.countDocuments({ status: 'Completed' });
    
    const totalUsers = await User.countDocuments();
    
    // Top 5 Leaders
    const topInviters = await User.find()
      .sort({ 'invites.valid': -1 })
      .limit(5);
      
    res.json({
      claims: {
        total: totalClaims,
        pending: pendingClaims,
        processing: processingClaims,
        approved: approvedClaims,
        rejected: rejectedClaims,
        completed: completedClaims
      },
      totalUsers,
      topInviters
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to compile stats' });
  }
});

// 2. Fetch and Search Claims
router.get('/claims', authenticateToken, requireAdmin, async (req, res) => {
  const { status, search } = req.query;
  
  try {
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { discordId: { $regex: search, $options: 'i' } },
        { claimId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const claims = await Claim.find(query).sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    logger.error('Error fetching claims list:', error);
    res.status(500).json({ error: 'Failed to retrieve claims' });
  }
});

// 3. Approve Claim from Web Portal
router.post('/claims/:claimId/approve', authenticateToken, requireAdmin, async (req, res) => {
  const { claimId } = req.params;
  const guildId = process.env.GUILD_ID;
  
  try {
    const claim = await Claim.findOne({ claimId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim session not found.' });
    }
    
    claim.status = 'Approved';
    await claim.save();
    
    // Trigger Discord Updates
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      // Send message to claim channel
      if (claim.channelId) {
        const channel = guild.channels.cache.get(claim.channelId);
        if (channel) {
          const successEmoji = await getEmoji(guildId, 'success');
          const embed = new EmbedBuilder()
            .setTitle(`${successEmoji} Claim Approved via Web Dashboard`)
            .setColor(0x55FF55)
            .setDescription(`Admin **${req.user.username}** has approved this claim.`)
            .addFields({ name: 'Claim ID', value: `\`${claim.claimId}\`` })
            .setTimestamp();
            
          await channel.send({ embeds: [embed] });
        }
      }
      
      // DM user
      try {
        const claimant = await client.users.fetch(claim.discordId);
        if (claimant) {
          const successEmoji = await getEmoji(guildId, 'success');
          const dmEmbed = new EmbedBuilder()
            .setTitle(`${successEmoji} Claim Approved!`)
            .setDescription(`Your claim for **${claim.rewardName}** (ID: \`${claim.claimId}\`) has been **approved** via the administration dashboard.`)
            .setColor(0x55FF55)
            .setTimestamp();
          await claimant.send({ embeds: [dmEmbed] });
        }
      } catch (dmErr) {
        logger.warn(`Could not DM user: ${dmErr.message}`);
      }
    }
    
    // Emit real-time SSE notification to the user's browser
    emitToUser(claim.discordId, {
      type: 'CLAIM_APPROVED',
      title: 'Claim Approved!',
      message: `Your reward claim for **${claim.rewardName}** has been approved by staff.`,
      claimId: claim.claimId,
      rewardName: claim.rewardName,
      status: 'Approved'
    });

    res.json({ message: 'Claim approved successfully.', claim });
  } catch (error) {
    logger.error('Error approving claim:', error);
    res.status(500).json({ error: 'Failed to approve claim' });
  }
});

// 4. Reject Claim from Web Portal
router.post('/claims/:claimId/reject', authenticateToken, requireAdmin, async (req, res) => {
  const { claimId } = req.params;
  const { reason } = req.body;
  const guildId = process.env.GUILD_ID;
  
  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required.' });
  }
  
  try {
    const claim = await Claim.findOne({ claimId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim session not found.' });
    }
    
    claim.status = 'Rejected';
    claim.rejectReason = reason;
    await claim.save();
    
    // Trigger Discord Updates
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      if (claim.channelId) {
        const channel = guild.channels.cache.get(claim.channelId);
        if (channel) {
          const errorEmoji = await getEmoji(guildId, 'error');
          const embed = new EmbedBuilder()
            .setTitle(`${errorEmoji} Claim Rejected via Web Dashboard`)
            .setColor(0xFF5555)
            .setDescription(`Admin **${req.user.username}** has rejected this claim.`)
            .addFields(
              { name: 'Claim ID', value: `\`${claim.claimId}\`` },
              { name: 'Reason', value: `\`${reason}\`` }
            )
            .setTimestamp();
            
          await channel.send({ embeds: [embed] });
        }
      }
      
      // DM user
      try {
        const claimant = await client.users.fetch(claim.discordId);
        if (claimant) {
          const errorEmoji = await getEmoji(guildId, 'error');
          const dmEmbed = new EmbedBuilder()
            .setTitle(`${errorEmoji} Claim Rejected`)
            .setDescription(`Your claim for **${claim.rewardName}** (ID: \`${claim.claimId}\`) has been **rejected**.\n\n**Reason:** ${reason}`)
            .setColor(0xFF5555)
            .setTimestamp();
          await claimant.send({ embeds: [dmEmbed] });
        }
      } catch (dmErr) {
        logger.warn(`Could not DM user: ${dmErr.message}`);
      }
    }
    
    // Emit real-time SSE notification to the user's browser
    emitToUser(claim.discordId, {
      type: 'CLAIM_REJECTED',
      title: 'Claim Rejected',
      message: `Your claim for **${claim.rewardName}** was rejected. Reason: ${reason}`,
      claimId: claim.claimId,
      rewardName: claim.rewardName,
      status: 'Rejected',
      reason
    });

    res.json({ message: 'Claim rejected successfully.', claim });
  } catch (error) {
    logger.error('Error rejecting claim:', error);
    res.status(500).json({ error: 'Failed to reject claim' });
  }
});

// 5. Search Users Profiles
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  const { search } = req.query;
  try {
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { discordId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query).limit(50);
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 6. Invite Logs
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    logger.error('Error loading audit logs:', error);
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

// 7. CRUD Rewards Interface (for Web Dashboard)
router.get('/rewards', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ requiredInvites: 1 });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/rewards', authenticateToken, requireAdmin, async (req, res) => {
  const { name, emoji, requiredInvites, description, rewardType, stock } = req.body;
  try {
    const newReward = new Reward({
      name,
      emoji,
      requiredInvites: Number(requiredInvites),
      description,
      rewardType,
      stock: Number(stock || 0)
    });
    await newReward.save();
    res.json({ message: 'Reward created.', reward: newReward });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/rewards/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, emoji, requiredInvites, description, rewardType, stock, isActive } = req.body;
  try {
    const reward = await Reward.findByIdAndUpdate(
      id,
      { name, emoji, requiredInvites, description, rewardType, stock, isActive },
      { new: true }
    );
    res.json({ message: 'Reward updated.', reward });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/rewards/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await Reward.findByIdAndDelete(id);
    res.json({ message: 'Reward deleted.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

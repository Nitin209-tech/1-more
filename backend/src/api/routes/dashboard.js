const express = require('express');
const User = require('../../models/User');
const Claim = require('../../models/Claim');
const { authenticateToken } = require('../middlewares/authMiddleware');
const logger = require('../../utils/logger');

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  
  try {
    let userProfile = await User.findOne({ discordId: userId });
    if (!userProfile) {
      userProfile = new User({ discordId: userId, username: req.user.username });
      await userProfile.save();
    }
    
    // Fetch claims history
    const claims = await Claim.find({ discordId: userId }).sort({ createdAt: -1 });
    
    // Find active claim
    const activeClaim = claims.find(c => ['Pending', 'Processing'].includes(c.status)) || null;
    
    const invites = {
      total: userProfile.invites.total,
      valid: userProfile.invites.valid,
      fake: userProfile.invites.fake,
      leaves: userProfile.invites.leaves,
      rejoins: userProfile.invites.rejoins,
      bonus: userProfile.invites.bonus,
      net: userProfile.invites.valid + userProfile.invites.bonus
    };
    
    res.json({
      username: userProfile.username,
      avatar: userProfile.avatar,
      invites,
      activeClaim,
      claimsHistory: claims
    });
  } catch (error) {
    logger.error(`Error loading dashboard stats for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

module.exports = router;

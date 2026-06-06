const express = require('express');
const Reward = require('../../models/Reward');
const logger = require('../../utils/logger');

const router = express.Router();

// Get active rewards
router.get('/', async (req, res) => {
  try {
    const rewards = await Reward.find({ isActive: true }).sort({ requiredInvites: 1 });
    res.json(rewards);
  } catch (error) {
    logger.error('Failed to fetch rewards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

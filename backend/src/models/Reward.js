const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    required: true // Custom Discord emoji format: <a:emoji_name:emoji_id>
  },
  requiredInvites: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rewardType: {
    type: String,
    required: true // 'nitro', 'robux', etc.
  },
  stock: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reward', RewardSchema);

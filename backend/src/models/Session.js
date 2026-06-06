const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  discordId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // Auto-expire session document after 7 days
  }
});

module.exports = mongoose.model('Session', SessionSchema);

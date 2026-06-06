const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
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
  invites: {
    total: { type: Number, default: 0 },
    valid: { type: Number, default: 0 },
    fake: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    rejoins: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 }
  },
  invitedBy: {
    type: String,
    default: null,
    index: true
  },
  invitedUsers: {
    type: [String],
    default: []
  },
  isAlt: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);

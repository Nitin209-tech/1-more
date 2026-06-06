const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  guildId: {
    type: String,
    required: true,
    index: true
  },
  inviterId: {
    type: String,
    required: true,
    index: true
  },
  uses: {
    type: Number,
    default: 0
  },
  maxUses: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invite', InviteSchema);

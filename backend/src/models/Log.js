const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['INVITE_JOIN', 'INVITE_LEAVE', 'CLAIM_CREATE', 'CLAIM_STATUS', 'ADMIN_ACTION', 'SYSTEM_ERROR'],
    index: true
  },
  userId: {
    type: String,
    default: null,
    index: true
  },
  username: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Log', LogSchema);

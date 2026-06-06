const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  claimId: {
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
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  rewardName: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    default: null
  },
  inviteCount: {
    type: Number,
    required: true
  },
  surveyData: {
    basicInfo: {
      type: Map,
      of: String,
      default: {}
    },
    verificationQuestions: {
      type: Map,
      of: String,
      default: {}
    },
    termsAccepted: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending',
    index: true
  },
  rejectReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ClaimSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Claim', ClaimSchema);

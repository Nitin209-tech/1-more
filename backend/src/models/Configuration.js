const mongoose = require('mongoose');

const ConfigurationSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  emojis: {
    type: Map,
    of: String,
    default: {
      nitro: '<a:nitro:123456789012345678>',
      nitrobasic: '<a:nitrobasic:123456789012345678>',
      nitroboost: '<a:nitroboost:123456789012345678>',
      robux: '<a:robux:123456789012345678>',
      robuxpremium: '<a:robuxpremium:123456789012345678>',
      verify: '<a:verify:123456789012345678>',
      loading: '<a:loading:123456789012345678>',
      success: '<a:success:123456789012345678>',
      error: '<a:error:123456789012345678>',
      gift: '<a:gift:123456789012345678>'
    }
  },
  claimCategory: {
    type: String,
    default: null
  },
  completedCategory: {
    type: String,
    default: null
  },
  logChannel: {
    type: String,
    default: null
  },
  staffRole: {
    type: String,
    default: null
  },
  minAccountAgeDays: {
    type: Number,
    default: 7
  },
  claimChannelPrefix: {
    type: String,
    default: 'claim-'
  },
  allowClaimantAccess: {
    type: Boolean,
    default: true
  },
  autoDeleteClaimsDays: {
    type: Number,
    default: 7
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Configuration', ConfigurationSchema);

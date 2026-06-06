const mongoose = require('mongoose');

const WelcomeSettingsSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  channelId: {
    type: String,
    default: null
  },
  title: {
    type: String,
    default: 'Welcome to our Server!'
  },
  description: {
    type: String,
    default: 'Welcome {user} to the community! You were invited by {inviter}. We now have {memberCount} members!'
  },
  banner: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WelcomeSettings', WelcomeSettingsSchema);

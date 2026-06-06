const Configuration = require('../../models/Configuration');
const logger = require('../../utils/logger');

// Default emojis fallback if not configured in the database
const DEFAULT_EMOJIS = {
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
};

/**
 * Get dynamic emoji configured in the database for the given guild.
 * @param {string} guildId - Discord Guild ID
 * @param {string} emojiKey - Name of the emoji (e.g. 'nitro', 'loading')
 * @returns {Promise<string>} Custom/Animated Discord emoji format
 */
const getEmoji = async (guildId, emojiKey) => {
  try {
    const config = await Configuration.findOne({ guildId });
    if (config && config.emojis && config.emojis.has(emojiKey)) {
      return config.emojis.get(emojiKey);
    }
  } catch (error) {
    logger.error(`Error fetching emoji ${emojiKey} for guild ${guildId}:`, error);
  }
  return DEFAULT_EMOJIS[emojiKey] || '';
};

module.exports = {
  getEmoji,
  DEFAULT_EMOJIS
};

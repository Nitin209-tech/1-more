const { trackMemberLeave } = require('../handlers/inviteTracker');
const logger = require('../../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member) {
    try {
      await trackMemberLeave(member);
    } catch (error) {
      logger.error('Error in guildMemberRemove event:', error);
    }
  }
};

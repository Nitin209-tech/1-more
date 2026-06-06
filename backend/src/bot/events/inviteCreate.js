const { trackInviteCreate } = require('../handlers/inviteTracker');
const logger = require('../../utils/logger');

module.exports = {
  name: 'inviteCreate',
  once: false,
  async execute(invite) {
    try {
      await trackInviteCreate(invite);
    } catch (error) {
      logger.error('Error in inviteCreate event:', error);
    }
  }
};

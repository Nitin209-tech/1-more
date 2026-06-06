const { trackInviteDelete } = require('../handlers/inviteTracker');
const logger = require('../../utils/logger');

module.exports = {
  name: 'inviteDelete',
  once: false,
  async execute(invite) {
    try {
      await trackInviteDelete(invite);
    } catch (error) {
      logger.error('Error in inviteDelete event:', error);
    }
  }
};

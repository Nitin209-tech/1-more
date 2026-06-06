const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/discord-invite-rewards';
  
  const options = {
    serverSelectionTimeoutMS: 5000 // Keep trying for 5 seconds before timeout
  };

  const connectWithRetry = async () => {
    logger.info('Attempting to connect to MongoDB...');
    try {
      await mongoose.connect(dbUri, options);
      logger.info('Successfully connected to MongoDB.');
    } catch (error) {
      logger.error('Error connecting to MongoDB. Retrying in 5 seconds...', error.message);
      // Wait 5 seconds and retry
      setTimeout(connectWithRetry, 5000);
    }
  };

  await connectWithRetry();
};

module.exports = connectDatabase;

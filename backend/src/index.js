require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');

// Database Models for seeding
const Reward = require('./models/Reward');
const Configuration = require('./models/Configuration');

// Discord Bot Client & Loaders
const client = require('./bot/client');
const { loadCommands } = require('./bot/handlers/commandHandler');
const { loadEvents } = require('./bot/handlers/eventHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Server & Bot
const bootstrap = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();
    
    // 2. Seed default values if empty
    await seedDefaultData();
    
    // 3. Configure Express Middlewares
    app.use(cors({ origin: '*' })); // Allow Next.js dashboard requests
    app.use(express.json());
    app.use(morgan('combined', { stream: { write: msg => logger.debug(msg.trim()) } }));
    
    // 4. Register API Routes
    app.use('/api/auth', require('./api/routes/auth'));
    app.use('/api/rewards', require('./api/routes/rewards'));
    app.use('/api/claims', require('./api/routes/claims'));
    app.use('/api/dashboard', require('./api/routes/dashboard'));
    app.use('/api/admin', require('./api/routes/admin'));
    app.use('/api/notifications', require('./api/routes/notifications').router);
    
    // Express healthcheck
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date() });
    });
    
    // 5. Initialize Discord Bot handlers
    loadCommands(client);
    loadEvents(client);
    
    // 6. Start Discord Bot
    const token = process.env.DISCORD_TOKEN;
    if (token && token !== 'your_bot_token_here') {
      await client.login(token);
    } else {
      logger.warn('DISCORD_TOKEN is set to default placeholder. Discord Bot boot skipped.');
    }
    
    // 7. Start Express API Web Server
    app.listen(PORT, () => {
      logger.info(`Express server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Bootstrap failure:', error);
    process.exit(1);
  }
};

/**
 * Seed Default Rewards and Configurations on startup if collections are empty.
 */
async function seedDefaultData() {
  const guildId = process.env.GUILD_ID || '123456789012345678';
  
  // Seed configurations
  const configCount = await Configuration.countDocuments({ guildId });
  if (configCount === 0) {
    logger.info('Seeding default configuration document...');
    const defaultConf = new Configuration({
      guildId,
      claimCategory: process.env.CLAIM_CATEGORY_ID || '123456789012345678',
      completedCategory: process.env.COMPLETED_CLAIM_CATEGORY_ID || '123456789012345678',
      logChannel: process.env.LOG_CHANNEL_ID || '123456789012345678',
      staffRole: process.env.STAFF_ROLE_ID || '123456789012345678'
    });
    await defaultConf.save();
  }
  
  // Seed Rewards
  const count = await Reward.countDocuments();
  if (count === 0) {
    logger.info('Seeding default system rewards into MongoDB...');
    const defaults = [
      {
        name: 'Nitro Basic Monthly',
        emoji: '<a:nitrobasic:123456789012345678>',
        requiredInvites: 3,
        description: 'Monthly Nitro Basic Reward',
        rewardType: 'nitro',
        stock: 50,
        isActive: true
      },
      {
        name: 'Nitro Boost Monthly',
        emoji: '<a:nitroboost:123456789012345678>',
        requiredInvites: 6,
        description: 'Monthly Nitro Boost Reward',
        rewardType: 'nitro',
        stock: 25,
        isActive: true
      },
      {
        name: '3000 Robux Gift Card',
        emoji: '<a:robux:123456789012345678>',
        requiredInvites: 3,
        description: '3000 Robux Digital Gift Card',
        rewardType: 'robux',
        stock: 100,
        isActive: true
      },
      {
        name: '6000 Robux Gift Card',
        emoji: '<a:robuxpremium:123456789012345678>',
        requiredInvites: 6,
        description: '6000 Robux Digital Gift Card',
        rewardType: 'robux',
        stock: 50,
        isActive: true
      }
    ];
    
    await Reward.insertMany(defaults);
    logger.info('Successfully seeded 4 default rewards.');
  }
}

bootstrap();

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const logger = require('../utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User
  ]
});

// Cache collections
client.commands = new Collection();
client.invites = new Map(); // Global memory map: guildId -> Collection(code -> uses)

module.exports = client;

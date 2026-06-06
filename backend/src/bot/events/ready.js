const { REST, Routes } = require('discord.js');
const logger = require('../../utils/logger');
const { initInviteTracker } = require('../handlers/inviteTracker');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`Discord Bot logged in as ${client.user.tag}!`);
    
    // Initialize invite tracker cache
    await initInviteTracker(client);
    
    // Register slash commands
    const commandsJson = [];
    client.commands.forEach(command => {
      commandsJson.push(command.data.toJSON());
    });
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const guildId = process.env.GUILD_ID;
    
    try {
      logger.info(`Started refreshing ${commandsJson.length} application (/) commands.`);
      
      if (guildId && guildId !== '123456789012345678') {
        // Instant guild registration
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, guildId),
          { body: commandsJson }
        );
        logger.info(`Successfully registered application commands in Guild: ${guildId}`);
      } else {
        // Global registration
        await rest.put(
          Routes.applicationCommands(client.user.id),
          { body: commandsJson }
        );
        logger.info('Successfully registered application commands globally.');
      }
    } catch (error) {
      logger.error('Error registering slash commands:', error);
    }
  }
};

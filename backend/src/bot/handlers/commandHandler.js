const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

const loadCommands = (client) => {
  const commandsPath = path.join(__dirname, '../commands');
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
  }

  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    
    // Check if it's a directory
    if (!fs.statSync(categoryPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          logger.info(`Loaded command: ${command.data.name} [Category: ${category}]`);
        } else {
          logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      } catch (error) {
        logger.error(`Failed to load command at ${filePath}:`, error);
      }
    }
  }
};

module.exports = { loadCommands };

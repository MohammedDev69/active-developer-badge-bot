const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const slashCommands = new Map();
const prefixCommands = new Map();
const slashCommandDataList = [];

// Load all command files in current directory (except index.js)
const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of commandFiles) {
    try {
        const cmd = require(path.join(__dirname, file));

        if (cmd.data && cmd.data.name) {
            slashCommands.set(cmd.data.name, cmd);
            slashCommandDataList.push(cmd.data.toJSON());
        }

        if (cmd.prefix) {
            const prefixes = Array.isArray(cmd.prefix) ? cmd.prefix : [cmd.prefix];
            for (const p of prefixes) {
                prefixCommands.set(p.toLowerCase(), cmd);
            }
        }
    } catch (err) {
        logger.error(`Error loading command file ${file}:`, err.message);
    }
}

logger.info(`Loaded ${slashCommands.size} slash commands and ${prefixCommands.size} prefix aliases.`);

module.exports = {
    slashCommands,
    prefixCommands,
    slashCommandDataList
};

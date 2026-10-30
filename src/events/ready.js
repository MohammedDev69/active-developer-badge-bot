const { REST, Routes, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../config');
const { slashCommandDataList } = require('../commands');
const badgeManager = require('../services/badgeManager');

module.exports = async function onReady(client) {
    logger.success(`Main Bot Logged in as ${client.user.tag} (ID: ${client.user.id})`);

    // Set Presence Activity
    const activityTypes = {
        PLAYING: ActivityType.Playing,
        STREAMING: ActivityType.Streaming,
        LISTENING: ActivityType.Listening,
        WATCHING: ActivityType.Watching,
        COMPETING: ActivityType.Competing
    };

    const type = activityTypes[config.status] || ActivityType.Watching;
    client.user.setPresence({
        activities: [{
            name: config.statusText || `${config.prefix}help | /help`,
            type: type,
            url: type === ActivityType.Streaming ? 'https://twitch.tv/discord' : undefined
        }],
        status: 'online'
    });

    // Register Slash Commands
    const rest = new REST({ version: '10' }).setToken(config.botToken);

    try {
        logger.info(`Refreshing ${slashCommandDataList.length} application (/) commands globally...`);
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommandDataList }
        );
        logger.success('Global slash commands registered successfully.');
    } catch (error) {
        logger.error('Failed to register global slash commands:', error);
    }

    // Initialize Badge Bots Manager
    try {
        await badgeManager.init();
    } catch (error) {
        logger.error('Failed to initialize badge manager:', error);
    }
};

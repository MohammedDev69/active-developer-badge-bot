const { Client, GatewayIntentBits, Events } = require('discord.js');
const logger = require('./utils/logger');
const config = require('./config');
const badgeManager = require('./services/badgeManager');

// Event Handlers
const onReady = require('./events/ready');
const onInteractionCreate = require('./events/interactionCreate');
const onMessageCreate = require('./events/messageCreate');

// Validate Environment
if (!config.botToken || config.botToken === 'YOUR_BOT_TOKEN_HERE') {
    logger.error('Missing Discord Bot Token! Please set BOT_TOKEN in your .env file.');
    logger.info('Refer to .env.example or README.md for configuration instructions.');
    process.exit(1);
}

// Initialize Main Bot Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Register Event Listeners
client.once(Events.ClientReady, () => onReady(client));
client.on(Events.InteractionCreate, (interaction) => onInteractionCreate(interaction));
client.on(Events.MessageCreate, (message) => onMessageCreate(message));

// Anti-Crash & Error Handling
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
    logger.error('Uncaught Exception:', err, 'origin:', origin);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    logger.error('Uncaught Exception Monitor:', err, 'origin:', origin);
});

// Graceful Shutdown Handler
const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    badgeManager.destroyAll();
    try {
        await client.destroy();
    } catch (_) {}
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start Main Bot
logger.info('Connecting Main Discord Bot...');
client.login(config.botToken).catch((err) => {
    logger.error('Failed to log in main bot:', err.message);
    process.exit(1);
});

module.exports = client;

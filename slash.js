/**
 * Standalone Badge Bots Runner
 * Runs all active badge bots stored in accounts.json
 */

const badgeManager = require('./src/services/badgeManager');
const logger = require('./src/utils/logger');

logger.info('Starting Active Developer Badge Bots standalone service...');
badgeManager.init();

// Anti-crash
process.on('unhandledRejection', (err) => logger.error('Unhandled Rejection:', err));
process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));

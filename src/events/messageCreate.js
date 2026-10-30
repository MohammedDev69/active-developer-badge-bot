const logger = require('../utils/logger');
const config = require('../config');
const { prefixCommands } = require('../commands');
const { embeds } = require('../utils/helpers');

module.exports = async function onMessageCreate(message) {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    const prefix = config.prefix;

    // Backward compatibility shortcut: "-setup" opens/sends the panel
    if (content === '-setup') {
        if (!config.isOwner(message.author.id)) {
            return message.reply({
                embeds: [embeds.error('Unauthorized', 'You do not have permission to use this command.')]
            });
        }
        const panelCmd = prefixCommands.get('panel');
        if (panelCmd) {
            return panelCmd.executePrefix(message, []);
        }
    }

    // Check if message starts with configured prefix
    if (!content.startsWith(prefix)) return;

    const args = content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (!commandName) return;

    const command = prefixCommands.get(commandName);
    if (!command) return;

    // Check owner only permission
    if (command.ownerOnly && !config.isOwner(message.author.id)) {
        return message.reply({
            embeds: [embeds.error('Unauthorized', 'You do not have permission to use this administrator command.')]
        });
    }

    try {
        await command.executePrefix(message, args);
    } catch (err) {
        logger.error(`Error executing prefix command ${prefix}${commandName}:`, err);
        await message.reply({
            embeds: [embeds.error('Command Error', 'An unexpected error occurred while executing this command.')]
        }).catch(() => {});
    }
};

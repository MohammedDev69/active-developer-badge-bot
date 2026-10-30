const logger = require('../utils/logger');
const config = require('../config');
const { slashCommands } = require('../commands');
const { embeds } = require('../utils/helpers');
const {
    handleOpenTicket,
    handleShowTokenModal,
    handleTokenModalSubmit,
    handleCloseTicket
} = require('../interactions/ticketHandler');

module.exports = async function onInteractionCreate(interaction) {
    try {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = slashCommands.get(interaction.commandName);
            if (!command) return;

            // Check Owner-only permission
            if (command.ownerOnly && !config.isOwner(interaction.user.id)) {
                return interaction.reply({
                    embeds: [embeds.error('Unauthorized', 'You do not have permission to use this administrator command.')],
                    ephemeral: true
                });
            }

            try {
                await command.executeSlash(interaction);
            } catch (err) {
                logger.error(`Error executing slash command /${interaction.commandName}:`, err);
                const replyMethod = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
                await interaction[replyMethod]({
                    embeds: [embeds.error('Command Error', 'An unexpected error occurred while executing this command.')],
                    ephemeral: true
                }).catch(() => {});
            }
            return;
        }

        // Handle Button Clicks
        if (interaction.isButton()) {
            const id = interaction.customId;

            // New & Legacy button IDs
            if (id === 'btn_open_ticket' || id === 'open_ticket' || id === 'الشراء') {
                return await handleOpenTicket(interaction);
            }

            if (id === 'btn_enter_token') {
                return await handleShowTokenModal(interaction);
            }

            if (id === 'btn_close_ticket' || id === 'close_ticket' || id === 'cancelPurchase') {
                return await handleCloseTicket(interaction);
            }
        }

        // Handle Modal Submissions
        if (interaction.isModalSubmit()) {
            const id = interaction.customId;

            if (id === 'modal_token_submit' || id === 'DeveloperConfig') {
                return await handleTokenModalSubmit(interaction);
            }
        }

    } catch (err) {
        logger.error('Unhandled interaction error:', err);
    }
};

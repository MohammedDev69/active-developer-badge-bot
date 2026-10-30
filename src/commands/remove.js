const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const badgeManager = require('../services/badgeManager');
const { embeds } = require('../utils/helpers');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a registered badge bot by Application ID or Token')
        .addStringOption(opt =>
            opt.setName('target')
                .setDescription('The Bot Application ID to remove')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    prefix: ['remove', 'deletebot'],
    usage: 'remove <bot_id>',
    description: 'Remove a registered badge bot from the system',
    ownerOnly: true,

    async executeSlash(interaction) {
        const target = interaction.options.getString('target').trim();
        const success = badgeManager.removeBot(target);

        if (success) {
            await interaction.reply({
                embeds: [embeds.success('Bot Removed', `Successfully stopped and removed bot \`${target}\` from the database.`)],
                ephemeral: true
            });
        } else {
            await interaction.reply({
                embeds: [embeds.error('Not Found', `No registered bot was found matching \`${target}\`. Use \`/list\` to view all bots.`)],
                ephemeral: true
            });
        }
    },

    async executePrefix(message, args) {
        const target = args[0];
        if (!target) {
            return message.reply({
                embeds: [embeds.error('Invalid Usage', `Usage: \`${config.prefix}remove <bot_id>\``)]
            });
        }

        const success = badgeManager.removeBot(target.trim());
        if (success) {
            await message.reply({
                embeds: [embeds.success('Bot Removed', `Successfully stopped and removed bot \`${target}\` from the database.`)]
            });
        } else {
            await message.reply({
                embeds: [embeds.error('Not Found', `No registered bot was found matching \`${target}\`. Use \`${config.prefix}list\` to view all bots.`)]
            });
        }
    }
};

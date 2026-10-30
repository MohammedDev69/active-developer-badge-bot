const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const badgeManager = require('../services/badgeManager');
const { validateBotToken, embeds } = require('../utils/helpers');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Manually activate an Active Developer badge bot for a user without payment')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The user receiving the badge')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('token')
                .setDescription('The Discord bot token to activate')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    prefix: ['give', 'addbot'],
    usage: 'give <@user> <token>',
    description: 'Manually register a bot token for a user',
    ownerOnly: true,

    async executeSlash(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('user');
        const token = interaction.options.getString('token');

        // Pre-validate token
        const validation = await validateBotToken(token);
        if (!validation.valid) {
            return interaction.editReply({
                embeds: [embeds.error('Invalid Token', `Discord API validation failed: ${validation.error}`)],
                ephemeral: true
            });
        }

        const addResult = await badgeManager.addBot(token, targetUser.id);
        if (!addResult.success) {
            return interaction.editReply({
                embeds: [embeds.error('Activation Failed', addResult.error)],
                ephemeral: true
            });
        }

        const botUser = validation.user;
        const invite = `https://discord.com/oauth2/authorize?client_id=${botUser.id}&scope=bot%20applications.commands&permissions=8`;

        await interaction.editReply({
            embeds: [embeds.success(
                'Bot Activated Manually',
                `Successfully registered and started bot **${botUser.username}** (ID: \`${botUser.id}\`) for ${targetUser}!\n\n**Invite URL:** [Click here to invite](${invite})\nNext: Run \`/get-badge\` on the bot.`
            )],
            ephemeral: true
        });
    },

    async executePrefix(message, args) {
        const targetUser = message.mentions.users.first();
        const token = args[1];

        if (!targetUser || !token) {
            return message.reply({
                embeds: [embeds.error('Invalid Usage', `Usage: \`${config.prefix}give <@user> <token>\``)]
            });
        }

        // Pre-validate token
        const validation = await validateBotToken(token);
        if (!validation.valid) {
            return message.reply({
                embeds: [embeds.error('Invalid Token', `Discord API validation failed: ${validation.error}`)]
            });
        }

        const addResult = await badgeManager.addBot(token, targetUser.id);
        if (!addResult.success) {
            return message.reply({
                embeds: [embeds.error('Activation Failed', addResult.error)]
            });
        }

        const botUser = validation.user;
        const invite = `https://discord.com/oauth2/authorize?client_id=${botUser.id}&scope=bot%20applications.commands&permissions=8`;

        await message.reply({
            embeds: [embeds.success(
                'Bot Activated Manually',
                `Successfully registered and started bot **${botUser.username}** (ID: \`${botUser.id}\`) for ${targetUser}!\n\n**Invite URL:** [Click here to invite](${invite})\nNext: Run \`/get-badge\` on the bot.`
            )]
        });
    }
};

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const badgeManager = require('../services/badgeManager');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all registered badge bots in the system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    prefix: ['list', 'bots'],
    usage: 'list',
    description: 'List all registered badge bots in the system',
    ownerOnly: true,

    buildListEmbed() {
        const bots = badgeManager.getBots();

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🤖 Registered Badge Bots (${bots.length})`)
            .setTimestamp();

        if (bots.length === 0) {
            embed.setDescription('No badge bots are currently registered in `accounts.json`.');
            return embed;
        }

        const lines = bots.map((b, i) => {
            const status = b.isOnline ? '🟢 Online' : '🔴 Offline';
            return `**${i + 1}.** ${status} - **${b.botTag}**\n   • ID: \`${b.botId}\` | Added by: <@${b.addedBy}>\n   • Token: \`${b.maskedToken}\``;
        });

        // Cap at 15 items per page to prevent hitting Discord embed limit
        const displayLines = lines.slice(0, 15);
        if (lines.length > 15) {
            displayLines.push(`*...and ${lines.length - 15} more.*`);
        }

        embed.setDescription(displayLines.join('\n\n'));
        return embed;
    },

    async executeSlash(interaction) {
        const embed = this.buildListEmbed();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async executePrefix(message, args) {
        const embed = this.buildListEmbed();
        await message.reply({ embeds: [embed] });
    }
};

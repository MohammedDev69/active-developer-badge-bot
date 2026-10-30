const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays information about all available commands'),
    prefix: ['help', 'commands', 'h'],
    usage: 'help',
    description: 'Displays information about all available commands',
    ownerOnly: false,

    buildHelpEmbed(isOwner = false) {
        const p = config.prefix;
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📖 Active Developer Badge Bot - Commands')
            .setDescription(`Prefix for text commands: \`${p}\`\nYou can also use Discord's native Slash Commands (\`/\`).`)
            .addFields(
                {
                    name: '🌐 General Commands',
                    value: [
                        `• \`/help\` or \`${p}help\` - Show this help menu`,
                        `• \`/stats\` or \`${p}stats\` - View bot status, active bots, and system uptime`
                    ].join('\n')
                }
            );

        if (isOwner) {
            embed.addFields({
                name: '⚙️ Admin / Owner Commands',
                value: [
                    `• \`/panel [channel]\` or \`${p}panel\` - Send the interactive badge ticket panel`,
                    `• \`/setup\` or \`${p}setup <category> <transfer_to> <log_room> <done_room>\` - Configure system channels & payment recipient`,
                    `• \`/setprice <amount>\` or \`${p}setprice <amount>\` - Update price in credits (0 for Free)`,
                    `• \`/give <@user> <token>\` or \`${p}give <@user> <token>\` - Manually activate a bot token for a user`,
                    `• \`/list\` or \`${p}list\` - View list of all registered badge bots`,
                    `• \`/remove <bot_id>\` or \`${p}remove <bot_id>\` - Remove a bot from the system`
                ].join('\n')
            });
        }

        embed.setFooter({ text: 'Active Developer System' }).setTimestamp();
        return embed;
    },

    async executeSlash(interaction) {
        const isOwner = config.isOwner(interaction.user.id);
        const embed = this.buildHelpEmbed(isOwner);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async executePrefix(message, args) {
        const isOwner = config.isOwner(message.author.id);
        const embed = this.buildHelpEmbed(isOwner);
        await message.reply({ embeds: [embed] });
    }
};

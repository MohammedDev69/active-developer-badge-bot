const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const badgeManager = require('../services/badgeManager');

function formatUptime(uptime) {
    const totalSeconds = Math.floor(uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View system statistics, memory, uptime, and active badge bots'),
    prefix: ['stats', 'status', 'botinfo', 'ping'],
    usage: 'stats',
    description: 'View system statistics, active bots and uptime',
    ownerOnly: false,

    buildStatsEmbed(client) {
        const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const memoryTotal = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2);
        const bots = badgeManager.getBots();
        const onlineCount = bots.filter(b => b.isOnline).length;

        return new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📊 Active Developer System Statistics')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🤖 Badge Bots Status', value: `Total: **${bots.length}** | Online: **${onlineCount}**`, inline: true },
                { name: '⚡ Bot Latency', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
                { name: '⏱️ Main Bot Uptime', value: `\`${formatUptime(client.uptime)}\``, inline: true },
                { name: '💾 RAM Usage', value: `\`${memoryUsed} MB / ${memoryTotal} MB\``, inline: true },
                { name: '🖥️ Platform', value: `\`Node.js ${process.version}\``, inline: true },
                { name: '🌐 Discord.js', value: `\`v14.27.0\``, inline: true }
            )
            .setFooter({ text: 'Active Developer System' })
            .setTimestamp();
    },

    async executeSlash(interaction) {
        const embed = this.buildStatsEmbed(interaction.client);
        await interaction.reply({ embeds: [embed] });
    },

    async executePrefix(message, args) {
        const embed = this.buildStatsEmbed(message.client);
        await message.reply({ embeds: [embed] });
    }
};

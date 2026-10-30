const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { embeds } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure system settings and channels')
        .addChannelOption(opt =>
            opt.setName('category')
                .setDescription('The category where tickets will be created')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('transferto')
                .setDescription('Discord User ID to receive ProBot credit payments')
                .setRequired(true)
        )
        .addChannelOption(opt =>
            opt.setName('logroom')
                .setDescription('Channel where purchase logs are sent')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addChannelOption(opt =>
            opt.setName('doneroom')
                .setDescription('Channel where public success announcements are posted')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    prefix: ['setup', 'config'],
    usage: 'setup <category_id> <transfer_to_id> <log_room_id> <done_room_id>',
    description: 'Configure system settings, channels and payment recipient',
    ownerOnly: true,

    async executeSlash(interaction) {
        const category = interaction.options.getChannel('category');
        const transferto = interaction.options.getString('transferto');
        const logroom = interaction.options.getChannel('logroom');
        const doneroom = interaction.options.getChannel('doneroom');

        config.update({
            ticketCategoryId: category.id,
            transferTo: transferto,
            logChannelId: logroom.id,
            doneChannelId: doneroom.id
        });

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('⚙️ Setup Updated Successfully')
            .addFields(
                { name: '📁 Ticket Category', value: `${category.name} (\`${category.id}\`)`, inline: true },
                { name: '💳 Payment Recipient', value: `<@${transferto}> (\`${transferto}\`)`, inline: true },
                { name: '📋 Log Channel', value: `${logroom} (\`${logroom.id}\`)`, inline: true },
                { name: '🎉 Announcement Channel', value: `${doneroom} (\`${doneroom.id}\`)`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async executePrefix(message, args) {
        if (args.length < 4) {
            const currentEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('⚙️ Current Configuration')
                .setDescription(`**Usage:** \`${config.prefix}setup <category_id> <transfer_to_id> <log_room_id> <done_room_id>\``)
                .addFields(
                    { name: 'Ticket Category', value: config.ticketCategoryId ? `<#${config.ticketCategoryId}> (\`${config.ticketCategoryId}\`)` : 'Not Set', inline: true },
                    { name: 'Payment Recipient', value: config.transferTo ? `<@${config.transferTo}> (\`${config.transferTo}\`)` : 'Not Set', inline: true },
                    { name: 'Log Channel', value: config.logChannelId ? `<#${config.logChannelId}> (\`${config.logChannelId}\`)` : 'Not Set', inline: true },
                    { name: 'Announcement Channel', value: config.doneChannelId ? `<#${config.doneChannelId}> (\`${config.doneChannelId}\`)` : 'Not Set', inline: true }
                )
                .setTimestamp();

            return message.reply({ embeds: [currentEmbed] });
        }

        const [catId, transferId, logId, doneId] = args.map(a => a.replace(/[^0-9]/g, ''));

        config.update({
            ticketCategoryId: catId,
            transferTo: transferId,
            logChannelId: logId,
            doneChannelId: doneId
        });

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('⚙️ Setup Updated Successfully')
            .addFields(
                { name: '📁 Ticket Category', value: `\`${catId}\``, inline: true },
                { name: '💳 Payment Recipient', value: `<@${transferId}> (\`${transferId}\`)`, inline: true },
                { name: '📋 Log Channel', value: `<#${logId}> (\`${logId}\`)`, inline: true },
                { name: '🎉 Announcement Channel', value: `<#${doneId}> (\`${doneId}\`)`, inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createPanelEmbed } = require('../interactions/ticketHandler');
const { embeds } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Sends the interactive Active Developer Badge purchase/claim panel')
        .addChannelOption(opt =>
            opt.setName('channel')
                .setDescription('The channel to send the panel in (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    prefix: ['panel', 'ticket-panel', 'send-panel'],
    usage: 'panel [#channel]',
    description: 'Sends the interactive Active Developer Badge claim panel',
    ownerOnly: true,

    async executeSlash(interaction) {
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        const panelData = createPanelEmbed();

        try {
            await targetChannel.send(panelData);
            await interaction.reply({
                embeds: [embeds.success('Panel Sent', `The interactive badge panel was posted in ${targetChannel}`)],
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                embeds: [embeds.error('Failed to Send', error.message)],
                ephemeral: true
            });
        }
    },

    async executePrefix(message, args) {
        const targetChannel = message.mentions.channels.first() ||
            (args[0] ? message.guild.channels.cache.get(args[0]) : null) ||
            message.channel;

        const panelData = createPanelEmbed();

        try {
            await targetChannel.send(panelData);
            if (targetChannel.id !== message.channel.id) {
                await message.reply({
                    embeds: [embeds.success('Panel Sent', `The interactive badge panel was posted in ${targetChannel}`)]
                });
            }
        } catch (error) {
            await message.reply({
                embeds: [embeds.error('Failed to Send Panel', error.message)]
            });
        }
    }
};

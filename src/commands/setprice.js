const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { embeds } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setprice')
        .setDescription('Set the price for the Active Developer Badge (in ProBot credits, 0 for free)')
        .addIntegerOption(opt =>
            opt.setName('price')
                .setDescription('The new price (0 = free)')
                .setRequired(true)
                .setMinValue(0)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    prefix: ['setprice', 'set-price', 'price'],
    usage: 'setprice <amount>',
    description: 'Set the price in ProBot credits (0 for free)',
    ownerOnly: true,

    async executeSlash(interaction) {
        const newPrice = interaction.options.getInteger('price');
        config.update({ price: newPrice });

        const desc = newPrice === 0
            ? 'The badge service is now set to **FREE**! Users will not be asked for ProBot credits.'
            : `Price has been updated to **${newPrice}** ProBot credits.`;

        await interaction.reply({
            embeds: [embeds.success('Price Updated', desc)],
            ephemeral: true
        });
    },

    async executePrefix(message, args) {
        if (!args[0] || isNaN(args[0])) {
            return message.reply({
                embeds: [embeds.error('Invalid Usage', `Usage: \`${config.prefix}setprice <amount>\` (current price: \`${config.price}\`)`)]
            });
        }

        const newPrice = Math.max(0, parseInt(args[0], 10));
        config.update({ price: newPrice });

        const desc = newPrice === 0
            ? 'The badge service is now set to **FREE**! Users will not be asked for ProBot credits.'
            : `Price has been updated to **${newPrice}** ProBot credits.`;

        await message.reply({
            embeds: [embeds.success('Price Updated', desc)]
        });
    }
};

const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const config = require('../config');
const logger = require('../utils/logger');
const { validateBotToken, calculateTax, embeds } = require('../utils/helpers');
const badgeManager = require('../services/badgeManager');

// Store active pending payments (userId -> { token, botUser, timer })
const pendingPayments = new Map();

/**
 * Creates or retrieves the main panel message
 */
function createPanelEmbed() {
    const priceText = config.price > 0 ? `\`${config.price}\` ProBot Credits` : '`FREE`';

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🛡️ Claim Your Active Developer Badge')
        .setDescription([
            'Get the official **Active Developer Badge** on your Discord profile easily and automatically!',
            '',
            '📌 **How it works:**',
            '1️⃣ Click the button below to open your private setup ticket.',
            '2️⃣ Provide your bot token (from the Discord Developer Portal).',
            `3️⃣ Complete setup (${priceText}).`,
            '4️⃣ Run `/get-badge` on your bot and claim your badge on Discord!',
            '',
            `💰 **Current Price:** ${priceText}`,
            '⚡ **Instant Activation:** Your bot will be brought online immediately.'
        ].join('\n'))
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/1828/1828884.png')
        .setFooter({ text: 'Discord Active Developer Service', iconURL: 'https://cdn-icons-png.flaticon.com/512/929/929430.png' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_open_ticket')
            .setLabel('Get Developer Badge')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛡️')
    );

    return { embeds: [embed], components: [row] };
}

/**
 * Handles the ticket creation button click
 */
async function handleOpenTicket(interaction) {
    const { guild, user } = interaction;

    // Check if user already has an open ticket
    const existingChannel = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText &&
        c.name === `badge-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    );

    if (existingChannel) {
        return interaction.reply({
            content: `⚠️ You already have an open ticket: ${existingChannel}`,
            ephemeral: true
        });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const categoryId = config.ticketCategoryId;
        const category = categoryId ? guild.channels.cache.get(categoryId) : null;

        const ticketChannel = await guild.channels.create({
            name: `badge-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            type: ChannelType.GuildText,
            parent: category ? category.id : undefined,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                },
                {
                    id: interaction.client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.EmbedLinks
                    ]
                }
            ]
        });

        // Welcome embed inside ticket
        const priceInfo = config.price > 0
            ? `Price: **${config.price} ProBot credits** (payable after token verification).`
            : `Price: **FREE** (instant activation).`;

        const welcomeEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🚀 Active Developer Badge - Setup Ticket')
            .setDescription([
                `Welcome ${user}! Please follow these instructions:`,
                '',
                '1️⃣ Go to [Discord Developer Portal](https://discord.com/developers/applications).',
                '2️⃣ Create a new Application (or select an existing one).',
                '3️⃣ In the left menu, select **Bot**.',
                '4️⃣ Click **Reset Token** and copy the bot token.',
                '5️⃣ Click the **Enter Bot Token** button below.',
                '',
                `💵 ${priceInfo}`,
                '',
                '🔒 *Your bot token is securely processed and only used to run the /get-badge command.*'
            ].join('\n'))
            .setFooter({ text: 'Active Developer System' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_enter_token')
                .setLabel('Enter Bot Token')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔑'),
            new ButtonBuilder()
                .setCustomId('btn_close_ticket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
        );

        await ticketChannel.send({
            content: `${user}`,
            embeds: [welcomeEmbed],
            components: [actionRow]
        });

        await interaction.editReply({
            content: `✅ Your ticket has been created: ${ticketChannel}`,
            ephemeral: true
        });

    } catch (error) {
        logger.error('Failed to create ticket channel:', error);
        await interaction.editReply({
            content: `❌ Failed to create ticket: ${error.message}`,
            ephemeral: true
        });
    }
}

/**
 * Handles "Enter Bot Token" button click -> shows modal
 */
async function handleShowTokenModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_token_submit')
        .setTitle('Enter Bot Token');

    const tokenInput = new TextInputBuilder()
        .setCustomId('bot_token_input')
        .setLabel('Discord Bot Token')
        .setPlaceholder('Enter your Discord bot token here...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(50);

    const row = new ActionRowBuilder().addComponents(tokenInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

/**
 * Handles the submission of the token modal
 */
async function handleTokenModalSubmit(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const rawToken = interaction.fields.getTextInputValue('bot_token_input');
    const { user, channel, client } = interaction;

    // Validate the token via Discord API
    const validation = await validateBotToken(rawToken);

    if (!validation.valid) {
        return interaction.editReply({
            embeds: [embeds.error('Invalid Bot Token', `Discord API could not verify this token.\n**Reason:** ${validation.error || 'Invalid credentials.'}`)],
            ephemeral: true
        });
    }

    const botUser = validation.user;
    const cleanToken = validation.cleanToken;

    // Check if bot is already registered
    const existingBots = badgeManager.getBots();
    const alreadyExists = existingBots.find(b => b.botId === botUser.id);
    if (alreadyExists) {
        return interaction.editReply({
            embeds: [embeds.warning('Already Registered', `The bot **${botUser.username}** (ID: \`${botUser.id}\`) is already registered in our system and active!`)],
            ephemeral: true
        });
    }

    await interaction.editReply({
        embeds: [embeds.success('Token Verified', `Successfully verified bot: **${botUser.username}** (ID: \`${botUser.id}\`)`)],
        ephemeral: true
    });

    // Check if free or paid
    if (config.price <= 0) {
        // Free mode - instant activation!
        await activateBot({
            token: cleanToken,
            botUser,
            buyer: user,
            channel,
            client,
            paidAmount: 0
        });
    } else {
        // Paid mode - trigger ProBot transfer flow
        await initiatePayment({
            token: cleanToken,
            botUser,
            buyer: user,
            channel,
            client
        });
    }
}

/**
 * Initiates the ProBot payment verification flow
 */
async function initiatePayment({ token, botUser, buyer, channel, client }) {
    const price = config.price;
    const taxedAmount = calculateTax(price);
    const transferTo = config.transferTo;

    const paymentEmbed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle('💳 ProBot Payment Required')
        .setDescription([
            `**Bot to Activate:** \`${botUser.username}\` (ID: \`${botUser.id}\`)`,
            `**Required Amount:** \`${price}\` credits`,
            `**Total with ProBot Tax:** \`${taxedAmount}\` credits`,
            `**Transfer Recipient:** <@${transferTo}> (\`${transferTo}\`)`,
            '',
            '📋 **Copy and paste this command into this channel:**',
            `\`\`\`c ${transferTo} ${taxedAmount}\`\`\``,
            '',
            '⏳ You have **2 minutes** to complete the payment.'
        ].join('\n'))
        .setFooter({ text: 'Awaiting ProBot confirmation...' })
        .setTimestamp();

    await channel.send({ content: `${buyer}`, embeds: [paymentEmbed] });

    // Store pending payment
    pendingPayments.set(buyer.id, { token, botUser });

    // Message collector for ProBot confirmation
    const probotId = config.probotId;
    const filter = (m) => {
        if (m.author.id !== probotId) return false;
        // Check if message mentions buyer username and correct price transfer
        const content = m.content;
        const matchesBuyer = content.includes(buyer.username);
        const matchesTransfer = content.includes(`has transferred \`$${price}\` to <@!${transferTo}>`) ||
                                content.includes(`has transferred \`$${price}\` to <@${transferTo}>`);
        return matchesBuyer && matchesTransfer;
    };

    const collector = channel.createMessageCollector({
        filter,
        max: 1,
        time: 120000 // 2 minutes
    });

    collector.on('collect', async (collectedMsg) => {
        logger.info(`Payment detected for ${buyer.tag} activating ${botUser.username}`);
        pendingPayments.delete(buyer.id);

        await activateBot({
            token,
            botUser,
            buyer,
            channel,
            client,
            paidAmount: price
        });
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time' && pendingPayments.has(buyer.id)) {
            pendingPayments.delete(buyer.id);
            const timeoutEmbed = embeds.error(
                'Payment Timed Out',
                'No payment confirmation was received within 2 minutes. Click **Enter Bot Token** if you want to try again.'
            );
            await channel.send({ embeds: [timeoutEmbed] });
        }
    });
}

/**
 * Activates the bot and sends notifications
 */
async function activateBot({ token, botUser, buyer, channel, client, paidAmount }) {
    const addResult = await badgeManager.addBot(token, buyer.id);

    if (!addResult.success) {
        return channel.send({
            embeds: [embeds.error('Activation Failed', `Failed to start the bot: ${addResult.error || 'Unknown error'}`)]
        });
    }

    const botInviteUrl = `https://discord.com/oauth2/authorize?client_id=${botUser.id}&scope=bot%20applications.commands&permissions=8`;

    // Success Embed in Ticket
    const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('🎉 Bot Activated Successfully!')
        .setDescription([
            `Your bot **${botUser.username}** is now online and connected to our Active Developer system!`,
            '',
            '📝 **Final Instructions to Claim Your Badge:**',
            `1️⃣ [Click here to invite your bot to your server](${botInviteUrl}).`,
            '2️⃣ In your server, run the slash command: `/get-badge` (or prefix `!get-badge`).',
            '3️⃣ Wait **24 hours** for Discord to refresh your eligibility status.',
            '4️⃣ Go to [Discord Active Developer Portal](https://discord.com/developers/active-developer) and claim your badge!',
            '',
            '✅ You may now safely close this ticket.'
        ].join('\n'))
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/1828/1828884.png')
        .setFooter({ text: 'Active Developer System' })
        .setTimestamp();

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Invite Your Bot')
            .setStyle(ButtonStyle.Link)
            .setURL(botInviteUrl)
            .setEmoji('🤖'),
        new ButtonBuilder()
            .setLabel('Active Developer Portal')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.com/developers/active-developer')
            .setEmoji('🛡️'),
        new ButtonBuilder()
            .setCustomId('btn_close_ticket')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
    );

    await channel.send({ content: `${buyer}`, embeds: [successEmbed], components: [actionRow] });

    // Send Public Announcement to Done Channel
    if (config.doneChannelId) {
        try {
            const doneChannel = await client.channels.fetch(config.doneChannelId);
            if (doneChannel) {
                const doneEmbed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('🎉 New Active Developer Badge Activation!')
                    .setDescription(`**User:** ${buyer} (\`${buyer.tag}\`)\n**Bot:** \`${botUser.username}\` (\`${botUser.id}\`)\n**Status:** Successfully Activated`)
                    .setTimestamp();
                await doneChannel.send({ embeds: [doneEmbed] });
            }
        } catch (err) {
            logger.warn('Failed to send announcement to doneChannel:', err.message);
        }
    }

    // Send Audit Log to Log Channel
    if (config.logChannelId) {
        try {
            const logChannel = await client.channels.fetch(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📋 Audit Log: Bot Activated')
                    .addFields(
                        { name: 'Buyer', value: `${buyer.tag} (\`${buyer.id}\`)`, inline: true },
                        { name: 'Bot Name', value: `${botUser.username} (\`${botUser.id}\`)`, inline: true },
                        { name: 'Price Paid', value: `${paidAmount} credits`, inline: true },
                        { name: 'Masked Token', value: `\`${logger.maskToken(token)}\``, inline: false }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (err) {
            logger.warn('Failed to send audit log to logChannel:', err.message);
        }
    }
}

/**
 * Handles closing and deleting the ticket
 */
async function handleCloseTicket(interaction) {
    await interaction.reply({
        content: '🔒 Closing ticket in 5 seconds...',
        ephemeral: false
    });

    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (err) {
            logger.error('Failed to delete ticket channel:', err.message);
        }
    }, 5000);
}

module.exports = {
    createPanelEmbed,
    handleOpenTicket,
    handleShowTokenModal,
    handleTokenModalSubmit,
    handleCloseTicket
};

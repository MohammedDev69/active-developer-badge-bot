const { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

const ACCOUNTS_PATH = path.resolve(__dirname, '../../accounts.json');

class BadgeManager {
    constructor() {
        this.clients = new Map(); // token -> Client
        this.botData = [];        // array of account records
        this.isInitialized = false;
    }

    /**
     * Reads accounts.json safely
     */
    loadAccounts() {
        try {
            if (fs.existsSync(ACCOUNTS_PATH)) {
                const data = fs.readFileSync(ACCOUNTS_PATH, 'utf8');
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    this.botData = parsed;
                    return this.botData;
                }
            }
        } catch (error) {
            logger.error('Failed to read or parse accounts.json:', error.message);
        }
        this.botData = [];
        this.saveAccounts();
        return this.botData;
    }

    /**
     * Saves accounts.json safely
     */
    saveAccounts() {
        try {
            fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(this.botData, null, 2), 'utf8');
        } catch (error) {
            logger.error('Failed to write accounts.json:', error.message);
        }
    }

    /**
     * Registers slash command (/get-badge) on a specific bot
     */
    async registerCommands(client, token) {
        try {
            const rest = new REST({ version: '10' }).setToken(token);
            const badgeCommand = new SlashCommandBuilder()
                .setName('get-badge')
                .setDescription('Claim and activate your Discord Active Developer Badge');

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: [badgeCommand.toJSON()] }
            );
            logger.info(`Registered /get-badge slash command for bot: ${client.user.tag} (${client.user.id})`);
        } catch (error) {
            logger.error(`Failed to register slash command for bot ${client.user?.tag || token}:`, error.message);
        }
    }

    /**
     * Creates the response embed for /get-badge or !get-badge
     */
    createBadgeEmbed() {
        const supportUrl = config.supportServer || 'https://discord.gg/discord-developers';
        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✨ Active Developer Badge - Activated!')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/1828/1828884.png')
            .setDescription([
                '✅ **Command successfully executed!**',
                'Your bot has received and executed an active application command.',
                '',
                '📋 **Next Steps to Claim Your Badge:**',
                '1️⃣ **Wait 24 Hours**: Discord’s badge eligibility system updates daily.',
                '2️⃣ **Visit Developer Portal**: Navigate to the official link below.',
                '3️⃣ **Claim Your Badge**: Choose this bot, select a community server, and confirm.',
                '',
                '🔗 **Direct Links:**',
                '• [Claim Your Active Developer Badge](https://discord.com/developers/active-developer)',
                '• [Active Developer FAQ & Guide](https://support-dev.discord.com/hc/en-us/articles/10113997751447)'
            ].join('\n'))
            .setFooter({ text: 'Active Developer Automated System', iconURL: 'https://cdn-icons-png.flaticon.com/512/929/929430.png' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Claim Badge Here')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/developers/active-developer')
                .setEmoji('🛡️'),
            new ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL(supportUrl)
                .setEmoji('🛠️')
        );

        return { embeds: [embed], components: [actionRow] };
    }

    /**
     * Attaches interaction and message handlers to a bot client
     */
    setupBotHandlers(client) {
        // Handle Slash Command /get-badge
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            if (interaction.commandName === 'get-badge') {
                try {
                    const response = this.createBadgeEmbed();
                    await interaction.reply({ ...response, ephemeral: true });
                } catch (err) {
                    logger.error(`Error replying to /get-badge on ${client.user.tag}:`, err.message);
                }
            }
        });

        // Also Handle Prefix Command (!get-badge or !badge)
        client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot) return;

            const content = message.content.trim().toLowerCase();
            if (content === '!get-badge' || content === '!badge' || content === '-get-badge') {
                try {
                    const response = this.createBadgeEmbed();
                    await message.reply(response);
                } catch (err) {
                    logger.error(`Error replying to prefix badge command on ${client.user.tag}:`, err.message);
                }
            }
        });
    }

    /**
     * Starts an individual bot client
     */
    async startBot(token, record = {}) {
        if (!token) return null;
        if (this.clients.has(token)) {
            return this.clients.get(token);
        }

        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        return new Promise((resolve) => {
            client.once(Events.ClientReady, async () => {
                logger.success(`Badge Bot Online: ${client.user.tag} (ID: ${client.user.id})`);

                // Register commands
                await this.registerCommands(client, token);
                this.setupBotHandlers(client);

                // Update record with bot metadata if missing
                let updated = false;
                if (!record.botId || record.botId !== client.user.id) {
                    record.botId = client.user.id;
                    updated = true;
                }
                if (!record.botTag || record.botTag !== client.user.tag) {
                    record.botTag = client.user.tag;
                    updated = true;
                }
                if (updated) this.saveAccounts();

                this.clients.set(token, client);
                resolve(client);
            });

            client.login(token).catch((err) => {
                logger.error(`Failed to log in badge bot with token ${logger.maskToken(token)}:`, err.message);

                // Remove invalid token from database
                const index = this.botData.findIndex(item => item.botToken === token);
                if (index !== -1) {
                    this.botData.splice(index, 1);
                    this.saveAccounts();
                    logger.warn(`Removed invalid token ${logger.maskToken(token)} from accounts.json`);
                }
                try { client.destroy(); } catch (_) {}
                resolve(null);
            });
        });
    }

    /**
     * Initializes all bots in accounts.json
     */
    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.loadAccounts();
        logger.info(`Starting Active Developer Badge Manager with ${this.botData.length} stored account(s)...`);

        for (const account of [...this.botData]) {
            const token = account.botToken;
            if (token) {
                await this.startBot(token, account);
            }
        }
        logger.success(`Badge Manager initialized: ${this.clients.size} bot(s) active.`);
    }

    /**
     * Adds and starts a new badge bot dynamically
     */
    async addBot(token, addedBy = 'System') {
        const cleanToken = token.trim().replace(/^Bot\s+/i, '');

        // Check if already in accounts
        const existing = this.botData.find(b => b.botToken === cleanToken);
        if (existing) {
            // If already present, make sure it's running
            if (!this.clients.has(cleanToken)) {
                await this.startBot(cleanToken, existing);
            }
            return {
                success: true,
                alreadyExisted: true,
                botTag: existing.botTag || 'Unknown Bot',
                botId: existing.botId
            };
        }

        const newRecord = {
            botToken: cleanToken,
            addedBy,
            addedAt: new Date().toISOString()
        };

        this.botData.push(newRecord);
        this.saveAccounts();

        const client = await this.startBot(cleanToken, newRecord);
        if (!client) {
            return { success: false, error: 'Could not log in with the provided bot token.' };
        }

        return {
            success: true,
            alreadyExisted: false,
            botTag: client.user.tag,
            botId: client.user.id
        };
    }

    /**
     * Removes a bot by ID or Token
     */
    removeBot(idOrToken) {
        const index = this.botData.findIndex(b => b.botId === idOrToken || b.botToken === idOrToken);
        if (index === -1) {
            return false;
        }

        const record = this.botData[index];
        const client = this.clients.get(record.botToken);
        if (client) {
            try { client.destroy(); } catch (_) {}
            this.clients.delete(record.botToken);
        }

        this.botData.splice(index, 1);
        this.saveAccounts();
        logger.info(`Removed bot ${record.botTag || record.botId || idOrToken}`);
        return true;
    }

    /**
     * Returns list of currently tracked bots
     */
    getBots() {
        return this.botData.map(account => {
            const client = this.clients.get(account.botToken);
            return {
                botId: account.botId || 'Unknown',
                botTag: account.botTag || client?.user?.tag || 'Offline',
                isOnline: Boolean(client && client.isReady()),
                addedBy: account.addedBy || 'N/A',
                addedAt: account.addedAt || 'N/A',
                maskedToken: logger.maskToken(account.botToken)
            };
        });
    }

    /**
     * Destroy all clients (graceful exit)
     */
    destroyAll() {
        logger.info(`Shutting down ${this.clients.size} badge bot(s)...`);
        for (const [token, client] of this.clients.entries()) {
            try { client.destroy(); } catch (_) {}
        }
        this.clients.clear();
    }
}

module.exports = new BadgeManager();

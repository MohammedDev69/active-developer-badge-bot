const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Load .env file
dotenv.config();

const CONFIG_PATH = path.resolve(__dirname, '../config.json');

const DEFAULT_CONFIG = {
    prefix: process.env.DEFAULT_PREFIX || '!',
    price: 600,
    transferTo: '764180361559146556',
    ticketCategoryId: '',
    logChannelId: '',
    doneChannelId: '',
    supportServer: 'https://discord.gg/6bqBzXcp4p',
    status: 'WATCHING',
    statusText: '!help | /help | Active Developer Badges'
};

let configData = { ...DEFAULT_CONFIG };

// Load config.json if exists
try {
    if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        configData = { ...DEFAULT_CONFIG, ...parsed };
    } else {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    }
} catch (error) {
    logger.error('Failed to load config.json, using defaults:', error.message);
}

// Parse Owner IDs from .env
const ownerIds = (process.env.OWNER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

// Fallback: also include transferTo as an owner if set
if (configData.transferTo && !ownerIds.includes(configData.transferTo)) {
    ownerIds.push(configData.transferTo);
}

const config = {
    // Environment values
    botToken: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    ownerIds,
    probotId: process.env.PROBOT_ID || '282859044593598464',

    // Dynamic config values
    get prefix() { return configData.prefix || '!'; },
    get price() { return Number(configData.price) || 0; },
    get transferTo() { return configData.transferTo; },
    get ticketCategoryId() { return configData.ticketCategoryId; },
    get logChannelId() { return configData.logChannelId; },
    get doneChannelId() { return configData.doneChannelId; },
    get supportServer() { return configData.supportServer; },
    get status() { return configData.status || 'WATCHING'; },
    get statusText() { return configData.statusText || '!help | /help'; },

    // Methods
    isOwner(userId) {
        if (!userId) return false;
        return this.ownerIds.includes(userId);
    },

    update(newSettings) {
        configData = { ...configData, ...newSettings };
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf8');
            logger.success('Configuration updated and saved to config.json');
            return true;
        } catch (error) {
            logger.error('Failed to save config.json:', error.message);
            return false;
        }
    },

    getAll() {
        return {
            ...configData,
            ownerIds: this.ownerIds,
            probotId: this.probotId
        };
    }
};

module.exports = config;

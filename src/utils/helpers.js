const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const https = require('https');
const logger = require('./logger');

/**
 * Validates a Discord bot token using Discord's REST API endpoint /users/@me
 * @param {string} token - The Discord bot token to test
 * @returns {Promise<{ valid: boolean, user?: object, error?: string }>}
 */
function validateBotToken(token) {
    return new Promise((resolve) => {
        if (!token || typeof token !== 'string' || token.trim().length < 50) {
            return resolve({ valid: false, error: 'Token is too short or invalid format.' });
        }

        const cleanToken = token.trim().replace(/^Bot\s+/i, '');

        const options = {
            hostname: 'discord.com',
            port: 443,
            path: '/api/v10/users/@me',
            method: 'GET',
            headers: {
                Authorization: `Bot ${cleanToken}`,
                'User-Agent': 'ActiveDeveloperBadgeBot/2.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode === 200 && parsed.id && parsed.bot) {
                        return resolve({ valid: true, user: parsed, cleanToken });
                    }
                    if (res.statusCode === 200 && !parsed.bot) {
                        return resolve({ valid: false, error: 'The provided token is a User account token, not a Bot token.' });
                    }
                    return resolve({
                        valid: false,
                        error: parsed.message || `Discord API returned status ${res.statusCode}`
                    });
                } catch (e) {
                    return resolve({ valid: false, error: 'Invalid response from Discord API.' });
                }
            });
        });

        req.on('error', (err) => {
            logger.error('Error connecting to Discord API for token validation:', err.message);
            resolve({ valid: false, error: 'Could not connect to Discord API.' });
        });

        req.setTimeout(8000, () => {
            req.destroy();
            resolve({ valid: false, error: 'Connection timed out while verifying token.' });
        });

        req.end();
    });
}

/**
 * Calculates ProBot credits transfer amount with 5% tax
 * Formula: Math.floor(price * (20 / 19) + 1)
 */
function calculateTax(price) {
    const num = Number(price);
    if (isNaN(num) || num <= 0) return 0;
    return Math.floor(num * (20 / 19) + 1);
}

/**
 * Standard Embed Builders
 */
const embeds = {
    primary: (title, description) => {
        return new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();
    },
    success: (title, description) => {
        return new EmbedBuilder()
            .setColor('#57F287')
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setTimestamp();
    },
    error: (title, description) => {
        return new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setTimestamp();
    },
    warning: (title, description) => {
        return new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle(`⚠️ ${title}`)
            .setDescription(description)
            .setTimestamp();
    }
};

module.exports = {
    validateBotToken,
    calculateTax,
    embeds
};

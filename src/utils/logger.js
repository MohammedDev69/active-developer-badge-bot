/**
 * Console Logger Utility with timestamps and log levels
 */

const formatTime = () => {
    const now = new Date();
    return now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
};

const logger = {
    info: (...args) => {
        console.log(`\x1b[36m[${formatTime()}] [INFO]\x1b[0m`, ...args);
    },
    success: (...args) => {
        console.log(`\x1b[32m[${formatTime()}] [SUCCESS]\x1b[0m`, ...args);
    },
    warn: (...args) => {
        console.warn(`\x1b[33m[${formatTime()}] [WARN]\x1b[0m`, ...args);
    },
    error: (...args) => {
        console.error(`\x1b[31m[${formatTime()}] [ERROR]\x1b[0m`, ...args);
    },
    maskToken: (token) => {
        if (!token || typeof token !== 'string') return 'N/A';
        if (token.length <= 10) return '***';
        return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
    }
};

module.exports = logger;

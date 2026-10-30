# 🛡️ Discord Active Developer Badge Bot

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14.27.0-blue.svg)](https://discord.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)]()

A complete, production-ready Discord bot service that automates the process of obtaining the official **Active Developer Badge** for Discord users. Built from the ground up using **Discord.js v14**, featuring a **Dual Command System (Slash Commands + Prefix Commands)**, interactive ticket claiming panels, automated ProBot payment verification, and a high-performance multi-bot runtime manager.

---

## ✨ Features

- ⚡ **Dual Command System**: Every single command can be executed via Discord's native **Slash Commands (`/`)** or traditional **Prefix Commands (`!`)**.
- 🤖 **Automated Multi-Bot Manager**: Spawns, monitors, and manages multiple user badge bots dynamically in memory—no duplicate processes or server memory leaks.
- 🎟️ **Interactive Ticket Claiming**: Beautiful embedded panel with buttons and secure modals for submitting bot tokens in private ticket channels.
- 💳 **Automated ProBot Payment Verification**: Real-time detection and verification of ProBot credit transfers with automatic 5% tax calculation.
- 🆓 **Free & Paid Support**: Toggle between paid badge service (with ProBot credits) or **100% Free** mode by simply setting price to `0`.
- 🔍 **Instant Token Validator**: Validates bot tokens directly against the Discord REST API (`/users/@me`) before accepting payments or storing credentials.
- 🛡️ **Self-Healing & Auto-Pruning**: Automatically detects revoked or invalid tokens, removes them from storage, and keeps the service healthy without crashes.
- 🔒 **Security First**: No hardcoded tokens or sensitive credentials. All tokens are masked in logs (`MTI2...****`) and `.env` is excluded via `.gitignore`.
- 📊 **Real-Time Statistics**: Live tracking of active bots, memory usage, uptime, WebSocket latency, and system health.
- 🛡️ **Anti-Crash Protection**: Comprehensive process exception and unhandled rejection guards.

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20+` or `v24+` recommended).
- **Discord Bot Token & Client ID**: From the [Discord Developer Portal](https://discord.com/developers/applications).
- **Discord Privileged Intents**:
  - `SERVER MEMBERS INTENT`
  - `MESSAGE CONTENT INTENT` (Required for prefix commands & ProBot payment tracking)

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/active-developer-badge-bot.git
cd active-developer-badge-bot
npm install
```

### 2. Configure Environment Variables (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` in your text editor and fill in your credentials:

```env
# Your Main Discord Bot Token (From Discord Developer Portal)
BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Your Discord Application (Client) ID
CLIENT_ID=YOUR_CLIENT_ID_HERE

# Comma-separated list of Discord User IDs with Owner/Admin permissions
OWNER_IDS=764180361559146556

# Default command prefix for text commands
DEFAULT_PREFIX=!

# ProBot Application ID (Default: 282859044593598464)
PROBOT_ID=282859044593598464
```

### 3. Configure Operational Settings (`config.json`)

You can edit `config.json` directly or use the in-Discord `/setup` command:

```json
{
  "prefix": "!",
  "price": 600,
  "transferTo": "YOUR_DISCORD_USER_ID",
  "ticketCategoryId": "YOUR_TICKET_CATEGORY_ID",
  "logChannelId": "YOUR_LOG_CHANNEL_ID",
  "doneChannelId": "YOUR_ANNOUNCEMENT_CHANNEL_ID",
  "supportServer": "https://discord.gg/your-invite",
  "status": "WATCHING",
  "statusText": "!help | /help | Active Developer Badges"
}
```

### 4. Start the Bot

```bash
npm start
```

---

## ⚙️ Discord Developer Portal Configuration

Ensure the following settings are enabled for your Main Bot in the [Discord Developer Portal](https://discord.com/developers/applications):

1. Go to your Application -> **Bot** tab.
2. Scroll to **Privileged Gateway Intents**:
   - ✅ **Presence Intent** (optional)
   - ✅ **Server Members Intent** (recommended)
   - ✅ **Message Content Intent** (Required for prefix commands & payment tracking)
3. Under **OAuth2** -> **URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Administrator` (or *Manage Channels*, *Send Messages*, *Embed Links*, *Attach Files*, *Read Message History*).
4. Invite the bot to your Discord server using the generated URL.

---

## 📖 Command Reference

All commands support **both** Slash Commands and Prefix Commands (default prefix: `!`):

### 🌐 Public Commands

| Slash Command | Prefix Command | Description |
|---|---|---|
| `/help` | `!help` | Displays command list and instructions |
| `/stats` | `!stats` | View active badge bots, RAM usage, ping, and uptime |

### 👑 Admin / Owner Commands

| Slash Command | Prefix Command | Description |
|---|---|---|
| `/panel [channel]` | `!panel [#channel]` | Sends the interactive Badge Claiming Ticket Panel |
| `/setup <category> <transferto> <logroom> <doneroom>` | `!setup <cat_id> <transfer_id> <log_id> <done_id>` | Configures channels and payment recipient ID |
| `/setprice <price>` | `!setprice <amount>` | Updates price in ProBot credits (`0` for Free mode) |
| `/give <@user> <token>` | `!give <@user> <token>` | Manually activates a badge bot for a user without payment |
| `/list` | `!list` | Lists all registered badge bots with masked tokens |
| `/remove <bot_id>` | `!remove <bot_id>` | Removes a registered badge bot and shuts down its client |

### 🤖 Badge Bots Commands (Executed on Users' Bots)

When a user adds their bot through the system, the bot automatically registers and responds to:
- `/get-badge` (Slash Command - Required by Discord to qualify for the badge)
- `!get-badge` or `!badge` (Prefix Command)

---

## 🎯 How End-Users Claim Their Badge

1. **Open Ticket**: User clicks **"Get Developer Badge"** on the ticket panel.
2. **Submit Token**: User creates a bot on the [Discord Developer Portal](https://discord.com/developers/applications), clicks **"Enter Bot Token"** in the ticket, and pastes the token.
3. **Validation & Payment**:
   - The system instantly checks if the token is valid.
   - If free (`price: 0`), activation happens immediately!
   - If paid (`price > 0`), the user transfers ProBot credits via `c <recipient> <taxed_price>`.
4. **Activation**: The bot joins the system, registers `/get-badge`, and provides the user with an invite link.
5. **Run Command**: The user invites their bot and runs `/get-badge`.
6. **Claim on Discord**: After **24 hours**, the user goes to [Discord Active Developer Portal](https://discord.com/developers/active-developer) to claim the badge for their profile!

---

## 📁 Project Architecture

```
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules (node_modules, .env, tokens)
├── config.json               # Operational settings (channels, price, prefix)
├── config.example.json       # Settings template for public distribution
├── accounts.json             # Stored badge bot tokens (safe empty array template)
├── accounts.example.json     # Schema example for accounts.json
├── package.json              # Project metadata, scripts, and dependencies
├── README.md                 # Project documentation
├── index.js                  # Clean application entry point
├── slash.js                  # Standalone badge bot service runner
└── src/
    ├── index.js              # Core bootstrap and error handling
    ├── config.js             # Configuration manager with live reload
    ├── commands/             # Unified Slash & Prefix command modules
    │   ├── index.js          # Command loader & registry
    │   ├── help.js           # Help command
    │   ├── panel.js          # Interactive panel poster
    │   ├── setup.js          # Channel & recipient setup
    │   ├── setprice.js       # Price configuration
    │   ├── give.js           # Manual badge bot giver
    │   ├── stats.js          # System statistics
    │   ├── list.js           # Bot registry list
    │   └── remove.js         # Bot unregister
    ├── events/               # Discord Gateway event handlers
    │   ├── ready.js          # Slash command registration & presence
    │   ├── interactionCreate.js # Slash, button, and modal router
    │   └── messageCreate.js  # Prefix command & payment router
    ├── interactions/
    │   └── ticketHandler.js  # Ticket creation, modal forms, and ProBot tracking
    ├── services/
    │   └── badgeManager.js   # Dynamic multi-bot runtime & slash command injector
    └── utils/
        ├── logger.js         # Timestamped, colored console logger
        └── helpers.js        # Token validator, tax calculator, embed factory
```

---

## 🛠️ Troubleshooting & FAQ

#### ❓ Why does Discord say I am not eligible yet after running `/get-badge`?
Discord's Active Developer Badge eligibility verification is **not instantaneous**. Discord updates its eligibility database once every **24 hours**. After executing `/get-badge`, wait 24 hours, then check [https://discord.com/developers/active-developer](https://discord.com/developers/active-developer).

#### ❓ What if a user enters an invalid token?
The system performs a pre-flight test against Discord's REST API endpoint (`/users/@me`) before accepting the token or prompting for payment. If the token is invalid or expired, the user receives an instant error notification without losing credits.

#### ❓ How do I make the service completely free?
Use the slash command `/setprice price: 0` or prefix command `!setprice 0`. The bot will automatically bypass payment requirements and activate user bots immediately upon token submission.

#### ❓ Can I host this 24/7 on VPS or cloud?
Yes! Use a process manager like [PM2](https://pm2.keymetrics.io/):
```bash
npm install -g pm2
pm2 start index.js --name "active-dev-bot"
pm2 save
pm2 startup
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

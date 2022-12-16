const Utils = require('./utils');
const fs = require('fs');

// loading config
const configDir = process.env.CONF_DIR ?? `${process.cwd() ?? ''}/conf`;
const configPath = `${configDir}/free-games-bot.json`;

Utils.log(`Using config dir ${configDir}`);
if (!fs.existsSync(configDir)) {
    throw new Error(`Config dir ${configDir} does not exists.`);
}

Utils.log(`Reading ${configPath}`);
if (!fs.existsSync(configPath)) {
    Utils.log(`Writing empty default file into ${configPath}`);
    fs.writeFileSync(configPath, JSON.stringify(require('../free-games-bot.empty.json'), null, 4));
}

/**
 * @typedef {Object} Config
 * @property {string}    prefix
 * @property {string}    command
 * @property {string}    token
 * @property {Object.<string, string[]}  guilds
 * @property {string}    weeklyAnnounce
 */

/**
 * Bot's configuration JSON
 * @type {Config}
 */
module.exports.config = require(configPath);
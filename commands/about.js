const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../utils');
const packageJson = require('../package.json');


/** Running version of the bot */
const version = process.env.npm_package_version || packageJson.version;

/** @type {import('../command-registering').CommandModule} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription(require('../help.json')['about'][0]),
    async execute(interaction) {
        await interaction.reply(`Free Games Bot version ${version} running in ${Utils.getTimeZone()} time zone.`);
    },
};
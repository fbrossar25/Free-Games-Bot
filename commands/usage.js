const { SlashCommandBuilder } = require('discord.js');
const { helpString } = require('./help');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('usage')
        .setDescription(require('../help.json')['usage'][0]),
    /** @type {import('..').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.reply(helpString('usage'));
    },
};
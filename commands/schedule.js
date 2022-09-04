const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription(require('../help.json')['schedule'][0]),
    /** @type {import('..').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.reply('Work in progress');
    },
};
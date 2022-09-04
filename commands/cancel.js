const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription(require('../help.json')['cancel'][0]),
    /** @type {import('..').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.reply('Work in progress');
    },
};
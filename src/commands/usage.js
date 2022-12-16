const { SlashCommandBuilder } = require('discord.js');
const { helpString } = require('./help');

/** @type {import('../command-registering').CommandModule} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('usage')
        .setDescription(require('../../help.json')['usage'][0]),
    /** @type {import('../index').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.reply(helpString('usage'));
    },
};
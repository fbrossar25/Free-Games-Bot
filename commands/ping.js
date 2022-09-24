const { SlashCommandBuilder } = require('discord.js');

/** @type {import('../command-registering').CommandModule} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription(require('../help.json')['ping'][0]),
    /** @type {import('..').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.reply('https://tenor.com/view/hello-there-gif-9442662');
    },
};
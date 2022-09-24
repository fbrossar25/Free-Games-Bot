const { SlashCommandBuilder } = require('discord.js');
const { cancel } = require('./schedule');

/** @type {import('../command-registering').CommandModule} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription(require('../help.json')['cancel'][0]),
    /** @type {import('..').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.deferReply();
        await interaction.editReply(await cancel(interaction.channel));
    },
};
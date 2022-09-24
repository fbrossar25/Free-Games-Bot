const { SlashCommandBuilder } = require('discord.js');
const { nextSchedule } = require('./schedule');


/** @type {import('../command-registering').CommandModule} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription(require('../help.json')['next'][0]),
    /** @type {import('..').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.reply(nextSchedule(interaction.channel));
    },
};
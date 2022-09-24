const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../utils');
const { nextSchedule } = require('./schedule');
const { fetch } = require('../fetch');


/**
 * @typedef FetchFunction
 * @property {() => string} fetch
 *
 * @typedef {import('../command-registering').CommandModule & FetchFunction} FetchModule
 */

/** @type {FetchModule} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('fetch')
        .setDescription(require('../help.json')['fetch'][0]),
    /** @type {import('../command-registering').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.deferReply();
        Utils.log(`Fetching games for channel ${interaction.guild.name}#${interaction.channel.name} (${interaction.guildId}#${interaction.channel.id}) asked by ${interaction.user.username} (${interaction.user.id})`);

        let message = await fetch();
        message += '\n' + nextSchedule(interaction.channel);
        try {
            await interaction.editReply(message);
        }
        catch (error) {
            Utils.logError('Error while replying', error);
        }
    },
};
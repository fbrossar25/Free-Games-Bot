import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import * as Utils from '../utils';
import help from '../help.json';

/** Running version of the bot */
const version = process.env.npm_package_version;

/** @type {import('../command-registering').CommandModule} */
export default {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription(help.about[0]),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply(`Free Games Bot version ${version} running in ${Utils.getTimeZone()} time zone.`);
    },
}
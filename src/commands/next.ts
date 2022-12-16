import {ChatInputCommandInteraction, SlashCommandBuilder, TextChannel} from 'discord.js';
import { nextSchedule } from './schedule';
import help from '../help.json';

export default {
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription(help.next[0]),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply(nextSchedule(interaction.channel as TextChannel));
    },
}
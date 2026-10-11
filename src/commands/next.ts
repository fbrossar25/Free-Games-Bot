import {ChatInputCommandInteraction, SlashCommandBuilder, TextChannel} from 'discord.js';
import { nextSchedule } from './schedule.ts';
import { help } from './help.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription(help.next[0]),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply(nextSchedule(interaction.channel as TextChannel));
    },
}

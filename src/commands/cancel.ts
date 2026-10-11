import {ChatInputCommandInteraction, SlashCommandBuilder, TextChannel} from 'discord.js';
import { cancel } from './schedule.ts';
import { help } from './help.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription(help.cancel[0]),
    /** @type {import('../index').ExecuteFunction} execute */
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        await interaction.editReply(await cancel(interaction.channel as TextChannel));
    },
}

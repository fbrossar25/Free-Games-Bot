import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import { help } from './help.ts';
import {helpString} from './help.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('usage')
        .setDescription(help.usage[0]),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply(helpString('usage'));
    },
}

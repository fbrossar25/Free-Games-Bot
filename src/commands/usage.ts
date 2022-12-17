import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import help from '../help.json';
import {helpString} from './help';

export default {
    data: new SlashCommandBuilder()
        .setName('usage')
        .setDescription(help.usage[0]),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply(helpString('usage'));
    },
}
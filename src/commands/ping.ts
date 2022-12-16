import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import help from '../help.json';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription(help.ping[0]),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('https://tenor.com/view/hello-there-gif-9442662');
    },
}
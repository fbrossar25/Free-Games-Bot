import {ChatInputCommandInteraction, SlashCommandBuilder, TextChannel} from 'discord.js';
import * as Utils from '../utils.ts';
import { nextSchedule } from './schedule.ts';
import { fetchAll } from '../fetch.ts';
import { help } from './help.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('fetch')
        .setDescription(help.fetch[0]),
    /** @type {import('../command-registering').ExecuteFunction} execute */
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        Utils.log(`Fetching games for channel ${interaction.guild?.name}#${(interaction.channel && 'name' in interaction.channel ? interaction.channel.name : '<unknown_name>')} (${interaction.guildId}#${interaction.channel?.id}) asked by ${interaction.user.username} (${interaction.user.id})`);

        let message = await fetchAll();
        message += '\n' + nextSchedule(interaction.channel as TextChannel);
        try {
            await interaction.editReply(message);
        }
        catch (error) {
            Utils.logError('Error while replying', error);
        }
    },
}

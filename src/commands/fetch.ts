import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from "discord.js";
import * as Utils from "../utils.ts";
import { fetchAll } from "../fetch.ts";
import { help } from "./help.ts";

export default {
    data: new SlashCommandBuilder()
        .setName("fetch")
        .setDescription(help.fetch[0]),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        Utils.log(
            `Fetching games for channel ${interaction.guild?.name}#${interaction.channel && "name" in interaction.channel ? interaction.channel.name : "<unknown_name>"} (${interaction.guildId}#${interaction.channel?.id}) asked by ${interaction.user.username} (${interaction.user.id})`
        );
        try {
            const [embed] = await fetchAll(true);
            await interaction.editReply({
                embeds: [embed],
            });
        } catch (error) {
            Utils.logError("Error while replying", error);
        }
    },
};

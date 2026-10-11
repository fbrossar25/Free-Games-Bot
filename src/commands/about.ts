import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import * as Utils from '../utils.ts';
import { help } from './help.ts';
import fs from 'node:fs';
import path from 'node:path';

/** Running version of the bot */
const version: string = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', '..', 'package.json'), 'utf8')).version;


/** @type {import('../command-registering').CommandModule} */
export default {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription(help.about[0]),
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply(`Free Games Bot version ${version} running in ${Utils.getTimeZone()} time zone.`);
    },
}

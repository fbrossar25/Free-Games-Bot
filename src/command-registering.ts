import { config } from './config';
import * as Utils from './utils';
const { REST, Routes, Collection, Interaction, SlashCommandBuilder } = require('discord.js');
import * as fs from 'node:fs';
import * as path from 'node:path';

const token = config.token;
const rest = new REST({ version: '10' }).setToken(token);

export type ExecuteFunction = (interaction: Interaction) => void;
export type CommandModule = {
    data: SlashCommandBuilder,
    execute: ExecuteFunction
}

export async function registerCommands() {
    const commandsMap = new Collection();
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        /** @type {CommandModule} */
        const command = require(filePath);
        commands.push(command.data.toJSON());
        commandsMap.set(command.data.name, command);
    }

    try {
        Utils.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(config.applicationId), { body: commands });
        Utils.log('Successfully reloaded application (/) commands.');
        return commandsMap;
    }
    catch (error) {
        Utils.logError('Unexpect error while registering commands', error);
        process.exit(1);
    }
}

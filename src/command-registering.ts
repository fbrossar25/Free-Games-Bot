import { config } from './config';
import * as Utils from './utils';
import { REST, Routes, Collection, Interaction, SlashCommandBuilder } from 'discord.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const token = config.token;
const rest = new REST({ version: '10' }).setToken(token);

export type ExecuteFunction = (interaction: Interaction) => Promise<void>;
export type CommandModule = {
    data: SlashCommandBuilder,
    execute: ExecuteFunction
}

export async function registerCommands(): Promise<Collection<string, CommandModule>> {
    const commandsMap = new Collection<string, CommandModule>();
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command: CommandModule = await import(filePath);
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

import { config } from './config.ts';
import * as Utils from './utils.ts';
import {REST, Routes, Collection, SlashCommandBuilder, type SlashCommandOptionsOnlyBuilder, type ChatInputCommandInteraction} from 'discord.js';
import about from './commands/about.ts';
import fetch from './commands/fetch.ts';
import help from './commands/help.ts';
import ping from './commands/ping.ts';
import usage from './commands/usage.ts';


const token = config.token;
const rest = new REST({ version: '10' }).setToken(token);

export type ExecuteFunction = (interaction: ChatInputCommandInteraction) => Promise<void>;

export type Module<T> = {
    __esModule: boolean,
    default: T
}

export type CommandModuleExport = {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
    execute: ExecuteFunction
}

export type CommandModule = Module<CommandModuleExport>;

export async function registerCommands(): Promise<Collection<string, CommandModuleExport>> {
    const commandsMap = new Collection<string, CommandModuleExport>()
    commandsMap.set('about', about);
    commandsMap.set('fetch', fetch);
    commandsMap.set('help', help);
    commandsMap.set('ping', ping);
    commandsMap.set('usage', usage);

    const commands = commandsMap.map((command) => command.data.toJSON());
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

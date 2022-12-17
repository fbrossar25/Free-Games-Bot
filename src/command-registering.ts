import { config } from './config';
import * as Utils from './utils';
import {REST, Routes, Collection, SlashCommandBuilder, ChatInputCommandInteraction} from 'discord.js';
import about from './commands/about';
import cancel from './commands/cancel';
import fetch from './commands/fetch';
import help from './commands/help';
import next from './commands/next';
import ping from './commands/ping';
import schedule from './commands/schedule';
import usage from './commands/usage';


const token = config.token;
const rest = new REST({ version: '10' }).setToken(token);

export type ExecuteFunction = (interaction: ChatInputCommandInteraction) => Promise<void>;

export type Module<T> = {
    __esModule: boolean,
    default: T
}

export type CommandModuleExport = {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>,
    execute: ExecuteFunction
}

export type CommandModule = Module<CommandModuleExport>;

export async function registerCommands(): Promise<Collection<string, CommandModuleExport>> {
    const commandsMap = new Collection<string, CommandModuleExport>()
    commandsMap.set('about', about);
    commandsMap.set('cancel', cancel);
    commandsMap.set('fetch', fetch);
    commandsMap.set('help', help);
    commandsMap.set('next', next);
    commandsMap.set('ping', ping);
    commandsMap.set('schedule', schedule);
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

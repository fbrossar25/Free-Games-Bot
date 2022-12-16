import * as Utils from './utils';
import { config } from './config';
import {Client, IntentsBitField, ChannelType, ClientOptions} from 'discord.js';
import { addExitCallback } from 'catch-exit';
import {CommandModule, registerCommands} from './command-registering';
import { schedule, weeklyAnnounceRule, gracefulShutdownScheduledJobs } from './commands/schedule';
import {Collection} from "@discordjs/collection";

/** Current bot's timezone */
Utils.log(`Running on ${Utils.getTimeZone()} timezone`);

/** Bot token for Discord API */
const token = config.token;
const intents = new IntentsBitField();
intents.add(
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
);

export class BotClient extends Client {
    public readonly clientRef: Client;
    public commands!: Collection<string, CommandModule>;
    constructor(options: ClientOptions, commands: Collection<string, CommandModule>) {
        super(options);
        this.clientRef = this;
        this.commands = commands;
    }
}

async function initialScheduleChannel(guildId: string, channelId: string, client: BotClient): Promise<void> {
    if(!channelId) return;
    Utils.log(`Scheduling for ${guildId}#${channelId}`);
    const channel = await client.channels.fetch(channelId);
    if(!channel) {
        Utils.log(`No channel found for ${guildId}#${channelId}`);
        return;
    }
    if (!channel) {
        Utils.log(`Channel ${guildId}#${channelId} not found`);
        return;
    }
    else if (channel.type !== ChannelType.GuildText) {
        Utils.log(`Channel ${guildId}#${channelId} is not a text channel`);
        return;
    }
    await schedule(weeklyAnnounceRule, channel);
}

async function initialScheduleChannelsForGuild(guildId: string, client: BotClient): Promise<void> {
    const channelIdsToSchedule = config.guilds[guildId];
    if (!Array.isArray(channelIdsToSchedule) || channelIdsToSchedule.length < 1) return;
    for (const channelId of channelIdsToSchedule) {
        await initialScheduleChannel(guildId, channelId, client);
    }
}

registerCommands().then(async commands => {
    /** This bot instance */
    const client = new BotClient({intents}, commands);

    addExitCallback(() => {
        Utils.log('Exiting...');
        gracefulShutdownScheduledJobs();
        Utils.log('Destroying client');
        client.destroy();
    });

    client.on('ready', async () => {
        Utils.log(`Logged in as ${client.user?.tag}!`);
        // TODO : schedule weekly from conf
        if (!config.guilds) return;

        for (const guildId in config.guilds) {
            await initialScheduleChannelsForGuild(guildId, client);
        }
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;
        const { commandName } = interaction;
        /** @type {import('./command-registering').CommandModule} */
        const command = (interaction.client as BotClient).commands.get(commandName);
        if (!command) {
            Utils.log(`Unknown command ${commandName}`);
            interaction.reply({
                content: `I don't know the ${commandName} command`,
                ephemeral: true,
            });
            return;
        }
        try {
            await command.execute(interaction);
        }
        catch (error) {
            Utils.logError(`Unexpected error while running command ${commandName}`, error);
            interaction.reply({
                content: 'Error while running this command',
                ephemeral: true,
            });
        }
    });

    await client.login(token);
    Utils.log('Login to Discord API successful');
});

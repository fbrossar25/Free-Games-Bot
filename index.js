const Utils = require('./utils');
const { config } = require('./config');
const { Client, IntentsBitField, ChannelType } = require('discord.js');
const { addExitCallback } = require('catch-exit');
const { gracefulShutdownSheculedJobs } = require('./commands/schedule');
const { registerCommands } = require('./command-registering');
const { schedule, weeklyAnnounceRule } = require('./commands/schedule');

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

/** This bot instance */
const client = new Client({ intents });
(async () => client.commands = await registerCommands())();

client.on('ready', async () => {
    Utils.log(`Logged in as ${client.user.tag}!`);
    // TODO : schedule weekly from conf
    if (config.guilds) {
        for (const guildId in config.guilds) {
            const channelIdsToSchedule = config.guilds[guildId];
            if (Array.isArray(channelIdsToSchedule) && channelIdsToSchedule.length > 0) {
                for (const channelId of channelIdsToSchedule) {
                    Utils.log(`Scheduling for ${guildId}#${channelId}`);
                    (async () => {
                        const channel = await client.channels.fetch(channelId);
                        channel.client = client;
                        if (!channel) {
                            Utils.log(`Channel ${guildId}#${channelId} not found`);
                            return;
                        }
                        else if (channel.type !== ChannelType.GuildText) {
                            Utils.log(`Channel ${guildId}#${channelId} is not a text channel`);
                            return;
                        }
                        await schedule(weeklyAnnounceRule, channel);
                    })();
                }
            }
        }
    }
    /*     if (Array.isArray(configgamesChannelsIds) && Array.isArray(gamesChannelsIdsToSchedule)) {
            gamesChannelsIdsToSchedule.forEach((chanId) => {
                if (gamesChannelsIds.includes(chanId)) {
                    client.channels.fetch(chanId).then(channel => schedule(channel, weeklyAnnounceRule, false));
                }
            });
        } */
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    /** @type {import('./command-registering').CommandModule} */
    const command = interaction.client.commands.get(commandName);
    if (!command) {
        Utils.log(`Unknown command ${commandName}`);
        interaction.reply({
            content: `I don't know the ${commandName} command`,
            ephemeral: true,
        });
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

client.login(token);

addExitCallback(async () => {
    Utils.log('Exiting...');
    gracefulShutdownSheculedJobs();
    Utils.log('Destroying client');
    client.destroy();
});

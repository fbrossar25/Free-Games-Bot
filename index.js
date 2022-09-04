/**
 * @callback ExecuteFunction
 * @param {import('discord.js').Interaction} interaction
 * @returns {InteractionResponse}
 */
/**
 * @typedef {Object} CommandModule
 * @property {SlashCommandBuilder} data
 * @property {ExecuteFunction} execute
 */

const Utils = require('./utils');
const { config } = require('./config');
const { Client, IntentsBitField } = require('discord.js');

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
(async () => client.commands = await require('./command-registering').registerCommands())();

client.on('ready', async () => {
    Utils.log(`Logged in as ${client.user.tag}!`);
    // TODO : schedule weekly from conf
    // if (Array.isArray(gamesChannelsIds) && Array.isArray(gamesChannelsIdsToSchedule)) {
    //     gamesChannelsIdsToSchedule.forEach((chanId) => {
    //         if (gamesChannelsIds.includes(chanId)) {
    //             client.channels.fetch(chanId).then(channel => schedule(channel, weeklyAnnounceRule, false));
    //         }
    //     });
    // }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
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

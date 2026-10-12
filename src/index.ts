import * as Utils from "./utils.ts";
import { config } from "./config.ts";
import {
    Client,
    type ClientOptions,
    Collection,
    IntentsBitField,
} from "discord.js";
import {
    type CommandModuleExport,
    registerCommands,
} from "./command-registering.ts";
import { doSchedule, gracefulShutdownScheduledJobs } from "./schedule.ts";
import process from "node:process";

/** Current bot's timezone */
Utils.log(`Running on ${Utils.getTimeZone()} timezone`);

/** Bot token for Discord API */
const token = config.token;
const intents = new IntentsBitField();
intents.add(IntentsBitField.Flags.Guilds);

export class BotClient extends Client {
    public readonly clientRef: Client;
    public commands!: Collection<string, CommandModuleExport>;
    constructor(
        options: ClientOptions,
        commands: Collection<string, CommandModuleExport>
    ) {
        super(options);
        this.clientRef = this;
        this.commands = commands;
    }
}

async function initialScheduleChannels(client: BotClient): Promise<void> {
    if (!config.guilds) {
        Utils.log("No guilds configured : nothing to schedule");
        return;
    }
    await doSchedule(client);
}

let currentlyCleaningUp = false;
const cleanup = async (client: BotClient, signal: string) => {
    if (currentlyCleaningUp) return;
    currentlyCleaningUp = true;
    Utils.log(`Exiting... (caught ${signal})`);
    await gracefulShutdownScheduledJobs();
    Utils.log("Destroying client");
    await client.destroy();
};

registerCommands().then(async (commands) => {
    /** This bot instance */
    const client = new BotClient({ intents: intents }, commands);

    // manually code this instead of using exit-hook or catch-exit packages because they don't work ts-node
    process.once("SIGINT", () => cleanup(client, "SIGINT")); // ctrl+c
    process.once("SIGTERM", () => cleanup(client, "SIGTERM")); // docker stop
    process.once("exit", () => cleanup(client, "exit")); // process.exit()

    client.on("ready", async () => {
        Utils.log(`Logged in as ${client.user?.tag}!`);
        await initialScheduleChannels(client);
    });

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        const { commandName } = interaction;
        const command = (interaction.client as BotClient).commands.get(
            commandName
        );
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
        } catch (error) {
            Utils.logError(
                `Unexpected error while running command ${commandName}`,
                error
            );
            interaction.reply({
                content: "Error while running this command",
                ephemeral: true,
            });
        }
    });

    await client.login(token);
    Utils.log("Login to Discord API successful");
});

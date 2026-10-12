import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';

export const help = {
  usage: [
    "Describe usage of Free games bot",
    "usage : `/[command]`",
    "Where command is one of :",
    "- `fetch` : fetch and display free games, main command of this bot",
    "- `ping` : Will show obi wan kenobi",
    "- `help` : Show help about a specific command. Example : `/help fetch`",
    "- `usage` : Show this list of usable commands",
    "- `about` : Show bot's version and timezone",
    "If neither command nor sources are provided, will show free games list. To know more : `/help`"
  ],
  fetch: [
    "List free games among various websites",
    "usage : `/fetch`",
    "To know more commands : `/usage`"
  ],
  help: [
    "Describe a command",
    "usage : `/help [command]`",
    "Where command is a command name known by the bot.",
    "To know more commands : `/usage`"
  ],
  ping: [
    "Will show obi wan kenobi",
    "usage : `/ping`"
  ],
  about: [
    "Show bot's currently running version and timezone",
    "usage : `/about`"
  ]
};

type HelpKey = keyof typeof help;

/**
 * Return the string to send when 'help' command is invoked
 * @param cmd which command's help message to print (null for global explanation of the bot)
 * @returns The help string to display
 */
export function helpString(cmd: HelpKey|string) {
    let lines = help.help;
    if (cmd in help) {
        lines = help[(cmd as HelpKey)];
    }
    else if (cmd) {
        // If cmd is undefined then just show help, otherwise show that the command is unknown
        lines = [`I don't know the '${cmd as unknown}' command, use \`/games help\` to know more`].concat(lines);
    }
    return lines.join('\n');
}

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(help['help'][0])
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('The command to describe')
                .setChoices(...Object.keys(help).map(cmd => { return { name: cmd, value: cmd }; }))
                .setRequired(false),
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getString('command');
        if(!command){
            await interaction.reply({ content: "missing 'command' parameter", ephemeral: true});
            return;
        }
        await interaction.reply({ content: helpString(command), ephemeral: true });
    }
}

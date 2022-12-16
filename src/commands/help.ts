import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import help from '../help.json';

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
        lines = [`I don't know the '${cmd}' command, use \`/games help\` to know more`].concat(lines);
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
const { SlashCommandBuilder } = require('discord.js');
const help = require('../../help.json');


/**
 * Return the string to send when 'help' command is invoked
 * @param {?string} cmd which command's help message to print (null for global explaination of the bot)
 * @returns {string} The help string to display
 */
function helpString(cmd) {
    let lines = help['help'];
    if (typeof cmd === 'string' && cmd in help) {
        lines = help[cmd];
    }
    else if (cmd) {
        // If cmd is undefined then just show help, otherwise show that the command is unknown
        lines = [`I don't know the '${cmd}' command, use \`/games help\` to know more`].concat(lines);
    }
    return lines.join('\n');
}

/** @type {import('../command-registering').CommandModule} */
module.exports = {
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
    /** @param {import('discord.js').Interaction} interaction */
    async execute(interaction) {
        await interaction.reply({ content: helpString(interaction.options.getString('command')), ephemeral: true });
    },
    helpString,
};
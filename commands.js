const help = require('./help.json');
const Scheduler = require('node-schedule');
const Games = require('./fetch-free-games');
const { parseRule, SimpleRule } = require('./rule');
const { Interaction, CacheType } = require('discord.js');
const Utils = require('./utils');
const packageJson = require('./package.json');

/** Default rule to apply for jobs scheduling */
const weeklyAnnounceRule = parseRule(config.weeklyAnnounce, new SimpleRule(4, 18, 30));
/** jobs maps, with channel's ids as keys, jobs as values */
const jobs = {};
/** Command recognized by the bot */
const commandName = config.command;
/** Prefix triggering a command parsing from a discord message */
const prefix = config.prefix;
/** Running version of the bot */
const version = process.env.npm_package_version || packageJson.version;

/**
 * Class representig a command from a discord message
 */
class Command {

    /**
     * Basic constructor
     * @param {!Discord.message} msg the discord message
     * @param {!Discord.channel} channel message's channel
     * @param {?string} name bot's command name, commands other than the one set in .env will be ignored
     * @param {?string[]} args bot command's arguments
     * @see commandName
     */
    constructor(msg, channel, name, args) {
        this.msg = msg;
        this.channel = channel;
        this.name = name;
        this.args = args;
    }
}

/**
 * Read and decompose a command from a message from a channel
 * @param {!Discord.Message} msg the discord message
 * @returns {Command} the parsed command
 */
function parseCommand(msg) {
    const args = msg.content.slice(prefix.length).trim().replace(/\s+/g, ' ').split(' ');
    args.map(element => element.toLowerCase());
    const name = args.shift();
    return new Command(msg, msg.channel, name, args);
}

/**
 * Execute a bot command beginning with the prefix string set in .env file
 * @param {!Interaction<CacheType>} interaction The parsed command from a discord message
 * @returns {Promise<any>}
 */
function command(interaction) {
    Utils.logError('debug', interaction);
    interaction.reply('TODO');
    switch (cmd.commandName) {
    case 'games':
        // TODO rewrite
        // games(cmd.channel, cmd.args); break;
    default:
        // for test purposes
        // unknownCommand(cmd.channel, cmd.name, cmd.args);
    }
}

/**
 * Display a message in the channel saying the given command is unknown
 * @param {!Discord.Channel} channel target channel
 * @param {?string} cmdName command name
 * @param {?string[]} cmdArgs command arguments
 */
function unknownCommand(channel, cmdName, cmdArgs) {
    let argsDisplay = '';
    if (cmdArgs === null
    || cmdArgs === undefined
    || (Array.isArray(cmdArgs) && cmdArgs.length === 0)
    || (typeof cmdArgs === 'string' && cmdArgs.replace(/\s+/g, '').length === 0)) {
        argsDisplay = 'No arguments provided';
    }
    else {
        argsDisplay = cmdArgs;
    }
    channel.send(`I don't know the command '${cmdName}' with those arguments : ${argsDisplay}. Use \`${prefix}${commandName} help\` to know more`).catch(console.error);
    Utils.log(`Unknown command '${cmdName}' received with args : ${cmdArgs}`);
}

/**
 * Execute the bot command in channel with given arguments
 * @param {!Discord.Channel} channel target channel
 * @param {?string[]} args command's arguments
 */
function games(channel, args) {
    if (Array.isArray(args)) {
        switch (args[0]) {
        case 'usage': showHelp(channel, 'usage'); break;
        case 'help': showHelp(channel, args[1]); break;
        case 'ping': ping(channel); break;
        case 'about': about(channel); break;
        case 'schedule': {
            let rule = null;
            if (args[1] && isValidRule(args[1])) {
                // D:HH:MM
                rule = parseRule(args[1]);
            }
            else if (args.length > 2) {
                // CRON
                const cron = args.slice(1).join(' ').trim();
                if (cron.length >= '* * * * *'.length) {
                    // Minimum cron length
                    rule = cron;
                }
            }
            schedule(channel, rule ? rule : weeklyAnnounceRule);
            break;
        }
        case 'cancel': cancelSchedule(channel); break;
        case 'next': nextSchedule(channel); break;
        case 'sources': showSources(channel); break;
        default: fetchFreeGamesList(channel, args);
        }
    }
    else {
        unknownCommand(channel, 'NO_COMMAND_PROVIDED', null);
    }
}


/**
 * 'sources' command implementation
 * Display the list of knwown sources for free games to display.
 * @param {!Discord.Channel} channel target channel
 */
function showSources(channel) {
    channel.send(`Here's the list of sources you can uses like \`${prefix}${commandName} source1 source2\` : ${Games.knownSources.join(', ')}`).catch(console.error);
}

/**
 * 'help' command implementation, see help.json file
 * Show an help message form the given command. Help messages are defined in the help.json file.
 * @param {!Discord.Channel} channel target channel
 * @param {?string} cmd which command's help message to print (null for global explaination of the bot)
 */
function showHelp(channel, cmd) {
    channel.send(helpString(cmd)).catch(console.error);
}

/**
 * 'next' command implementation
 * Returns a displayable message about the next annoucment date.
 * @param {!Discord.Channel} channel target channel
 * @param {boolean} [announce=true] whether to post the message in the channel or not
 * @return {string} the message to display
 */
function nextSchedule(channel, announce = true) {
    let date = null;
    if (jobs[channel.id]) {
        date = jobs[channel.id].nextInvocation();
    }
    let message;
    if (date) {
        message = `Next notification will be on ${Utils.getDateString(date.toDate())}`;
    }
    else {
        message = 'I\'ve got nothing planned out there';
    }
    if (announce) {
        channel.send(message).catch(console.error);
    }
    return message;
}

/**
 * 'cancel' command implementation.
 *  Cancel any scheduled jobs for the specified channel
 * @param {!Discord.Channel} channel target channel
 */
function cancelSchedule(channel) {
    if (jobs[channel.id]) {
        jobs[channel.id].cancel();
        channel.send('All scheduled tasks ar now canceled for this channel, my job here is done !').catch(console.error);
        Utils.log(`Scheduled task cancelled for channel ${channel.guild.name}#${channel.name} (${channel.id})`);
    }
    else {
        channel.send('Nothing scheduled on this channel').catch(console.error);
    }
}

/**
 * 'schedule' command implementation
 * Schedule a recurrent job to annouce free games in a channel with the specified rule
 * @param {!Discord.Channel} channel target channel
 * @param {!SimpleRule | string} rule Recurrency rule in SimpleRule instance, or CRON expression
 * @param {boolean} [announce=true] whether to post in the channel when will be the next announce or not
 */
function schedule(channel, rule = weeklyAnnounceRule, announce = true) {
    const jobFct = () => fetchFreeGamesList(channel, Games.knownSources, true);
    let job = jobs[channel.id];
    if (job) {
        job.cancel();
    }
    job = Scheduler.scheduleJob(rule, jobFct);
    jobs[channel.id] = job;
    if (job) {
        Utils.log(`Scheduled notification on ${channel.guild.name}#${channel.name} (${channel.id}), next one on ${Utils.getDateString(job.nextInvocation().toDate())}`);
    }
    else {
        Utils.log(`Unable to schedule notification on ${channel.guild.name}#${channel.name} (${channel.id}), rescheduling to default ${rule === weeklyAnnounceRule ? 'failed' : ''}`);
        if (rule !== weeklyAnnounceRule) {
            schedule(channel, weeklyAnnounceRule);
        }
    }
    if (announce) {
        nextSchedule(channel);
    }
}

/**
 * Fetch free games and displays the list in the given channel
 * @param {?Discord.Channel} channel target channel
 * @param {?string[]} sourcesToFetch sources to fetch
 * @param {boolean} [mentionEveryone=false] whether to mention everyone in the post
 */
function fetchFreeGamesList(channel, sourcesToFetch, mentionEveryone = false) {
    if (channel) {
        let knownSources = [];
        const unknownSources = [];
        if (Array.isArray(sourcesToFetch) && sourcesToFetch.length > 0) {
            sourcesToFetch.forEach(source => Games.knownSources.includes(source) ? knownSources.push(source) : unknownSources.push(source));
        }
        else {
            knownSources = Games.knownSources;
        }

        if (knownSources.length <= 0) {
            // No known sources or maybe unknown command
            unknownCommand(channel, sourcesToFetch[0], sourcesToFetch.slice(1));
            return;
        }

        Games.fetch(knownSources).then((result) => {
            Utils.log(`Fetching games for channel ${channel.name} (${channel.id})`);
            const lines = [];
            if (result.games.length === 0) {
                lines.push('No free games for today :(');
            }
            else {
                lines.push('Free games this week !');
                for (const game of result.games) {
                    lines.push(`${game.name} ${game.url}`);
                }
            }

            if (Array.isArray(unknownSources) && unknownSources.length > 0) {
                lines.push(`I don't know some sources that was provided : ${unknownSources.join()}`);
            }

            if (result.errors.length > 0) {
                const sources = [];
                for (const error of result.errors) {
                    sources.push(error.source);
                }
                lines.push(`Sadly, I was unable to get games from those sites : ${sources.join()}`);
            }
            lines.push(nextSchedule(channel, false));
            if (mentionEveryone) {
                lines[0] = `@everyone ${lines[0]}`;
            }
            channel.send(lines.join('\n')).catch(console.error);
        }).catch(error => {
            channel.send(`:exploding_head: I was unable to fetch fetch games frome those sources : ${sourcesToFetch} :exploding_head:`).catch(console.error);
            channel.send('https://tenor.com/view/idont-understand-error-hack-data-codes-gif-17581898');
            Utils.log(`An error occured while fetching games : ${JSON.stringify(error)}`);
        });
    }
    else {
        Utils.log('Cannot fetch games -> channel null or undefined');
    }
}

module.exports.Command = Command;
module.exports.command = command;
module.exports.schedule = schedule;
module.exports.helpString = helpString;
module.exports.weeklyAnnounceRule = weeklyAnnounceRule;
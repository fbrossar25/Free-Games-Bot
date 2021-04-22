const Discord = require('discord.js');
const Scheduler = require('node-schedule');
const Utils = require('./utils');
const Games = require('./fetch-free-games');
const help = require('./help.json');
const moment = require('moment-timezone');
const packageJson = require('./package.json');
require('dotenv').config();

/** Current bot's timezone */
const timezone = process.env.TIMEZONE;

if(timezone === 'string') {
    if(moment.tz.zone(timezone)) {
        moment.tz.setDefault(timezone);
        Utils.log(`Running on ${timezone} timezone (convifugred)`);
    }
    else {
        Utils.log(`Invalid timezone given : ${timezone} -> Running on ${moment.tz.guess()} timezone (fallback guessed)`);
    }
}
else {
    Utils.log(`Running on ${moment.tz.guess()} timezone (guessed)`);
}

/**
 * Class wrapping a simple rule to run a job once a week
 */
class SimpleRule {
    /**
     * Basic day, hour, minute constructor
     * @param {!number} dayOfWeek integer from 0 to 6, 0 being Sunday
     * @param {!number} hour integer from 0 to 23
     * @param {!number} minute integer from 0 to 59
     * @throws throw an error if one of the parameters is out of bounds
     */
    constructor(dayOfWeek, hour, minute) {
        this.dayOfWeek = dayOfWeek;
        this.hour = hour;
        this.minute = minute;
        if(!this.checkValidity()) {
            throw Error(`Invalid rule : ${this.dayOfWeek}:${this.hour}:${this.minute}`);
        }
    }

    /**
     * Returns true if the rule is valid, checking whether each members are in bounds
     * @returns true or false
     */
    checkValidity() {
        const dayOfWeekIsValid = 0 <= this.dayOfWeek && this.dayOfWeek <= 6;
        const hourIsValid = 0 <= this.hour && this.hour <= 23;
        const minuteIsValid = 0 <= this.minute && this.minute <= 59;
        return dayOfWeekIsValid && hourIsValid && minuteIsValid;
    }
}

/**
 * Check whether the given string is a simple rule in the D:HH:MM format or not
 * @param {?string} rule the rule to check
 */
function isValidRule(rule) {
    return ruleRegexp.test(rule.trim());
}

/**
 * Check if the given rule is valid and returns a SimpleRule instance
 * @param {?string} rule the rule to parse (D:HH:MM format)
 * @param {null|SimpleRule} [defaultRule=null] the default rule to return if rule is not a valid string
 */
function parseRule(rule, defaultRule = null) {
    if(!isValidRule(rule)) {
        Utils.log(`${process.env.WEEKLY_ANNOUNCE} is not a valid rule, must be in D:HH:MM, where D is day of week beetween 0 (Sunday) and 6, HH is hour of day, MM minute of hour`);
        return defaultRule;
    }
    const ruleParts = rule.trim().split(':');
    return new SimpleRule(parseInt(ruleParts[0]), parseInt(ruleParts[1]), parseInt(ruleParts[2]));
}

/** Prefix triggering a command parsing from a discord message */
const prefix = process.env.PREFIX;
/** Bot token for Discord API */
const token = process.env.TOKEN;
/** list of channels ids where the bot is able to posts */
const gamesChannelsIds = process.env.CHANNELS_IDS.split(',');
/** list of channels ids where the bot will schedule jobs automatically */
const gamesChannelsIdsToSchedule = process.env.CHANNELS_IDS_TO_SCHEDULE.split(',');
/** D:HH:MM format with optional leading 0 for hours */
const ruleRegexp = /^[0-6]:(?:0?\d|1\d|2[0-3]):[0-5][0-9]$/;
/** Default rule to apply for jobs scheduling */
const weeklyAnnounceRule = parseRule(process.env.WEEKLY_ANNOUNCE, new SimpleRule(4, 18, 30));
/** Command recognized by the bot */
const commandName = process.env.COMMAND;
/** This bot instance */
const client = new Discord.Client();
/** jobs maps, with channel's ids as keys, jobs as values */
const jobs = {};
/** Running version of the bot */
const version = process.env.npm_package_version || packageJson.version;

client.on('ready', () => {
    Utils.log(`Logged in as ${client.user.tag}!`);
    if(Array.isArray(gamesChannelsIds) && Array.isArray(gamesChannelsIdsToSchedule)) {
        gamesChannelsIdsToSchedule.forEach((chanId) => {
            if(gamesChannelsIds.includes(chanId)) {
                client.channels.fetch(chanId).then(channel => schedule(channel, weeklyAnnounceRule, false));
            }
        });
    }
});

client.on('message', (msg) => {
    if(gamesChannelsIds.includes(msg.channel.id) && msg.content.startsWith(prefix + commandName)) {
        command(parseCommand(msg));
    }
});

client.login(token);

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
 * @param {!Command} cmd The parsed command from a discord message
 */
function command(cmd) {
    switch (cmd.name) {
    case 'games': games(cmd.channel, cmd.args); break;
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
    if(cmdArgs === null
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
    if(Array.isArray(args)) {
        switch(args[0]) {
        case 'usage': showHelp(channel, 'usage'); break;
        case 'help': showHelp(channel, args[1]); break;
        case 'ping': ping(channel); break;
        case 'about': about(channel); break;
        case 'schedule': {
            let rule = null;
            if(args[1] && isValidRule(args[1])) {
                // D:HH:MM
                rule = parseRule(args[1]);
            }
            else if (args.length > 2) {
                // CRON
                const cron = args.slice(1).join(' ').trim();
                if(cron.length >= '* * * * *'.length) {
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
 * 'about' command implementation
 * Display bot's version and timezone
 * @param {!Discord.Channel} channel target channel
 */
function about(channel) {
    channel.send(`Free Games Bot version ${version} running in ${timezone} time zone.`);
}

/**
 * 'ping' command implementation
 * Hello there !
 * @param {!Discord.Channel} channel target channel
 */
function ping(channel) {
    channel.send('https://tenor.com/view/hello-there-gif-9442662').catch(console.error);
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
    let lines = help['help'];
    if(typeof cmd === 'string' && cmd in help) {
        lines = help[cmd];
    }
    else if(cmd) {
        // If cmd is undefined then just show help, otherwise show that the command is unknown
        lines = [`I don't know the '${cmd}' command, use \`${prefix}${commandName} help\` to know more`].concat(lines);
    }
    channel.send(lines.join('\n').replace(/\$prefix/ig, prefix).replace(/\$cmd/ig, commandName)).catch(console.error);
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
    if(jobs[channel.id]) {
        date = jobs[channel.id].nextInvocation();
    }
    let message;
    if(date) {
        message = `Next notification will be on ${Utils.getDateString(date.toDate())}`;
    }
    else{
        message = 'I\'ve got nothing planned out there';
    }
    if(announce) {
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
    if(jobs[channel.id]) {
        jobs[channel.id].cancel();
        channel.send('All scheduled tasks ar now canceled for this channel, my job here is done !').catch(console.error);
        Utils.log(`Scheduled task cancelled for channel ${channel.guild.name}#${channel.name} (${channel.id})`);
    }
    else{
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
    if(job) {
        job.cancel();
    }
    job = Scheduler.scheduleJob(rule, jobFct);
    jobs[channel.id] = job;
    if(job) {
        Utils.log(`Scheduled notification on ${channel.guild.name}#${channel.name} (${channel.id}), next one on ${Utils.getDateString(job.nextInvocation().toDate(), null, true)}`);
    }
    else {
        Utils.log(`Unable to schedule notification on ${channel.guild.name}#${channel.name} (${channel.id}), rescheduling to default ${rule === weeklyAnnounceRule ? 'failed' : ''}`);
        if(rule !== weeklyAnnounceRule) {
            schedule(channel, weeklyAnnounceRule);
        }
    }
    if(announce) {
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
    if(channel) {
        let knownSources = [];
        const unknownSources = [];
        if(Array.isArray(sourcesToFetch) && sourcesToFetch.length > 0) {
            sourcesToFetch.forEach(source => Games.knownSources.includes(source) ? knownSources.push(source) : unknownSources.push(source));
        }
        else {
            knownSources = Games.knownSources;
        }

        if(knownSources.length <= 0) {
            // No known sources or maybe unknown command
            unknownCommand(channel, sourcesToFetch[0], sourcesToFetch.slice(1));
            return;
        }

        Games.fetch(knownSources).then((result) => {
            Utils.log(`Fetching games for channel ${channel.name} (${channel.id})`);
            const lines = [];
            if(result.games.length === 0) {
                lines.push('No free games for today :(');
            }
            else{
                lines.push('Free games this week !');
                for(const game of result.games) {
                    lines.push(`${game.name} ${game.url}`);
                }
            }

            if(Array.isArray(unknownSources) && unknownSources.length > 0) {
                lines.push(`I don't know some sources that was provided : ${unknownSources.join()}`);
            }

            if(result.errors.length > 0) {
                const sources = [];
                for(const error of result.errors) {
                    sources.push(error.source);
                }
                lines.push(`Sadly, I was unable to get games from those sites : ${sources.join()}`);
            }
            lines.push(nextSchedule(channel, false));
            if(mentionEveryone) {
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
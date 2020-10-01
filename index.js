const Discord = require('discord.js');
const Scheduler = require('node-schedule');
const Utils = require('./utils');
const Games = require('./fetch-free-games');
const help = require('./help.json');
const moment = require('moment');
const thisServerUtcOffset = moment().utc().utcOffset();
require('dotenv').config();

// Relative channel offset from the running server point of view
function getRelativeChannelOffset(channel) {
    if(channel) {
        return thisServerUtcOffset - moment(channel.createdAt).utc().utcOffset();
    }
    return 0;
}

class SimpleRule {
    constructor(dayOfWeek, hour, minute) {
        this.dayOfWeek = dayOfWeek;
        this.minute = minute;
        this.hour = hour;
    }

    forChannelUtc(channel) {
        // negate channel offset to adapt to current server offset
        const m = moment.utc().hours(this.hour).minutes(this.minute).utcOffset(getRelativeChannelOffset(channel));
        return new SimpleRule(this.dayOfWeek, m.hours(), m.minutes());
    }
}

function isValidRule(rule) {
    return ruleRegexp.test(rule.trim());
}

function parseRule(rule, defaultRule = null) {
    if(!isValidRule(rule)) {
        Utils.log(`${process.env.WEEKLY_ANNOUNCE} is not a valid rule, must be in D:HH:MM, where D is day of week beetween 0 (Sunday) and 6, HH is hour of day, MM minute of hour`);
        return defaultRule;
    }
    const ruleParts = rule.trim().split(':');
    return new SimpleRule(parseInt(ruleParts[0]), parseInt(ruleParts[1]), parseInt(ruleParts[2]));
}

const prefix = process.env.PREFIX;
const token = process.env.TOKEN;
const gamesChannelsIds = process.env.CHANNELS_IDS.split(',');
const gamesChannelsIdsToSchedule = process.env.CHANNELS_IDS_TO_SCHEDULE.split(',');
// HH:MM format with optional leading 0
const ruleRegexp = /^[0-6]:(?:0?\d|1\d|2[0-3]):[0-5][0-9]$/;
const defaultWeeklyAnnounceRule = new SimpleRule(4, 18, 30);
const weeklyAnnounceRule = parseRule(process.env.WEEKLY_ANNOUNCE, defaultWeeklyAnnounceRule);
const commandName = process.env.COMMAND;
const client = new Discord.Client();
const jobs = {};

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

function parseCommand(msg) {
    const args = msg.content.slice(prefix.length).trim().replace(/\s+/g, ' ').split(' ');
    args.map(element => element.toLowerCase());
    const name = args.shift();
    return {
        msg: msg,
        channel: msg.channel,
        name: name,
        args: args,
    };
}

function command(cmd) {
    switch (cmd.name) {
    case 'games': games(cmd.channel, cmd.args); break;
    default: unknownCommand(cmd.channel, cmd.name, cmd.args);
    }
}

function unknownCommand(channel, cmdName, cmdArgs) {
    channel.send(`I don't know the command '${cmdName}' with those arguments : ${cmdArgs}`).catch(console.error);
    Utils.log(`Unknown command '${cmdName}' received with args : ${cmdArgs}`);
}

function ping(channel) {
    channel.send('https://tenor.com/view/hello-there-gif-9442662').catch(console.error);
}

function games(channel, args) {
    if(Array.isArray(args)) {
        switch(args[0]) {
        case 'usage': showHelp(channel, 'usage'); break;
        case 'help': showHelp(channel, args[1]); break;
        case 'ping': ping(channel); break;
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
        default:
            if(args.length === 0) {
                fetchFreeGamesList(channel);
            }
            else {
                const knownSources = [];
                const unknownSources = [];
                args.forEach(source => Games.knownSources.includes(source) ? knownSources.push(source) : unknownSources.push(source));
                if(knownSources.length > 0) {
                    // At least one known source
                    fetchFreeGamesList(channel, knownSources, unknownSources);
                }
                else {
                    // No known sources or maybe unknown command
                    unknownCommand(channel, args[0], args.slice(1));
                }
            }
        }
    }
    else {
        unknownCommand(channel, 'NO_COMMAND_PROVIDED', '');
    }
}

function showSources(channel) {
    channel.send(`Here's the list of sources you can uses like \`!games source1 source2\` command: ${Games.knownSources.join(', ')}`).catch(console.error);
}

function showHelp(channel, cmd) {
    let lines = help['help'];
    if(typeof cmd === 'string' && cmd in help) {
        lines = help[cmd];
    }
    else if(cmd) {
        // If cmd is undefined then just show help, otherwise show that the command is unknown
        lines = [`I don't know the '${cmd}' command`].concat(lines);
    }
    channel.send(lines.join('\n')).catch(console.error);
}

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

function schedule(channel, rule = weeklyAnnounceRule, announce = true) {
    const jobFct = () => fetchFreeGamesList(channel, Games.knownSources, [], true);
    let job = jobs[channel.id];
    if(job) {
        job.cancel();
    }
    job = Scheduler.scheduleJob(rule instanceof SimpleRule ? rule.forChannelUtc(channel) : rule, jobFct);
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

function fetchFreeGamesList(channel, sourcesToFetch, unknownSources, mentionEveryone = false) {
    if(channel) {
        Games.fetch(sourcesToFetch).then((result) => {
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
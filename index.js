const Discord = require('discord.js');
const Scheduler = require('node-schedule');
const Utils = require('./utils');
const Games = require('./fetch-free-games');
const help = require('./help.json');

require('dotenv').config();

const prefix = process.env.PREFIX;
const token = process.env.TOKEN;
const gamesChannelsIds = process.env.CHANNELS_IDS.split(',');
const gamesChannelsIdsToSchedule = process.env.CHANNELS_IDS_TO_SCHEDULE.split(',');
const gamesCron = process.env.GAMES_CRON;
const commandName = process.env.COMMAND;
const client = new Discord.Client();
const cronJobs = {};

client.on('ready', () => {
    Utils.log(`Logged in as ${client.user.tag}!`);
    if(Array.isArray(gamesChannelsIds) && Array.isArray(gamesChannelsIdsToSchedule)) {
        gamesChannelsIdsToSchedule.forEach((chanId) => {
            if(gamesChannelsIds.includes(chanId)) {
                client.channels.fetch(chanId).then(channel => schedule(channel, gamesCron, false));
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
    channel.send(`I don't know the command '${cmdName}' with those arguments : ${cmdArgs}`);
    Utils.log(`Unknown command '${cmdName}' received with args : ${cmdArgs}`);
}

function ping(channel) {
    channel.send('https://tenor.com/view/hello-there-gif-9442662');
}

function games(channel, args) {
    if(Array.isArray(args)) {
        switch(args[0]) {
        case 'usage': showHelp(channel, 'usage'); break;
        case 'help': showHelp(channel, args[1]); break;
        case 'ping': ping(channel); break;
        case 'schedule': {
            const cron = args.slice(1).join(' ').trim();
            schedule(channel, cron.length > 0 ? cron : gamesCron);
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
    channel.send(`Here's the list of sources you can uses like \`!games source1 source2\` command: ${Games.knownSources.join(', ')}`);
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
    channel.send(lines.join('\n'));
}

function nextSchedule(channel) {
    let date = null;
    if(cronJobs[channel.id]) {
        date = cronJobs[channel.id].nextInvocation();
    }
    if(date) {
        channel.send(`Next notifications will be on ${Utils.getDateString(date.toDate())}`);
    }
    else{
        channel.send('I\'ve got nothing planned out there');
    }
}

function cancelSchedule(channel) {
    if(cronJobs[channel.id]) {
        cronJobs[channel.id].cancel();
        channel.send('All scheduled tasks ar now canceled for this channel, my job here is done !');
        Utils.log(`Scheduled task cancelled for channel ${channel.guild.name}#${channel.name} (${channel.id})`);
    }
    else{
        channel.send('Nothing scheduled on this channel');
    }
}

function schedule(channel, cron = gamesCron, announce = true) {
    let job = cronJobs[channel.id];
    if(job) {
        job.cancel();
    }
    job = Scheduler.scheduleJob(cron, () => fetchFreeGamesList(channel));
    cronJobs[channel.id] = job;
    if(job) {
        Utils.log(`Scheduled notifications on ${channel.guild.name}#${channel.name} (${channel.id}), next one on ${Utils.getDateString(job.nextInvocation().toDate())}`);
    }
    else {
        Utils.log(`Unable to schedule notifications on ${channel.guild.name}#${channel.name} (${channel.id}), rescheduling to default`);
        schedule(channel, gamesCron);
    }
    if(announce) {
        nextSchedule(channel);
    }
}

function fetchFreeGamesList(channel, sourcesToFetch, unknownSources) {
    if(channel) {
        Games.fetch(sourcesToFetch).then((result) => {
            Utils.log(`Fetching games for channel ${channel.name} (${channel.id})`);
            // Utils.log(`Result : ${JSON.stringify(result)}`);
            if(result.games.length === 0) {
                channel.send('@everyone No free games for today :(');
            }
            else{
                channel.send('@everyone Free games this week !');
                for(const game of result.games) {
                    channel.send(`${game.name} ${game.url}`);
                }
            }

            if(Array.isArray(unknownSources) && unknownSources.length > 0) {
                channel.send(`I don't know some sources that was provided : ${unknownSources.join()}`);
            }

            if(result.errors.length > 0) {
                const sources = [];
                for(const error of result.errors) {
                    sources.push(error.source);
                }
                channel.send(`Sadly, I was unable to get games from those sites : ${sources.join()}`);
            }

            nextSchedule(channel);
        });
    }
    else {
        Utils.log('Cannot fetch games -> channel null or undefined');
    }
}
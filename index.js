const Discord = require('discord.js');
const Scheduler = require('node-schedule');
const Utils = require('./utils');
const Games = require('./fetch-free-games');

const prefix = process.env.PREFIX;
const token = process.env.TOKEN;
const gamesChannelsIds = process.env.CHANNELS_IDS.split(',');
const gamesChannelsIdsToSchedule = process.env.CHANNELS_IDS_TO_SCHEDULE.split(',');
const gamesCron = process.env.GAMES_CRON;
const client = new Discord.Client();
const cronJobs = {};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    if(Array.isArray(gamesChannelsIds) && Array.isArray(gamesChannelsIdsToSchedule)) {
        gamesChannelsIdsToSchedule.forEach((chanId) => {
            if(gamesChannelsIds.includes(chanId)) {
                client.channels.fetch(chanId).then(channel => schedule(channel, gamesCron, false));
            }
        });
    }
});

client.on('message', (msg) => {
    if(gamesChannelsIds.includes(msg.channel.id) && msg.content.startsWith(prefix)) {
        command(parseCommand(msg));
    }
});

client.login(token);

function parseCommand(msg) {
    const args = msg.content.slice(prefix.length).trim().split(' ');
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
    case 'ping': ping(cmd.channel); break;
    case 'games': games(cmd.channel, cmd.args); break;
    default: console.log(`Unknown command '${cmd.name}' received with args : ${cmd.args} `);
    }
}

function ping(channel) {
    channel.send('Pong!');
}

function games(channel, args) {
    if(Array.isArray(args)) {
        switch(args[0]) {
        case 'schedule': schedule(channel); break;
        case 'cancel': cancelSchedule(channel); break;
        case 'next': nextSchedule(channel); break;
        default: fetchFreeGamesList(channel, args);
        }
    }
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
        job.reschedule(gamesCron);
    }
    else{
        job = Scheduler.scheduleJob(cron, () => fetchFreeGamesList(channel));
        cronJobs[channel.id] = job;
    }
    if(job) {
        Utils.log(`Scheduled notifications on ${channel.guild.name}#${channel.name} (${channel.id}), next one on ${Utils.getDateString(job.nextInvocation().toDate())}`);
    }
    else {
        Utils.log(`Unable to schedule notifications on ${channel.guild.name}#${channel.name} (${channel.id})`);
    }
    if(announce) {
        nextSchedule(channel);
    }
}

function fetchFreeGamesList(channel, args) {
    if(channel) {
        Games.fetch().then((result) => {
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

            if(result.errors.length > 0) {
                const sources = [];
                for(const error of result.errors) {
                    sources.push(error.source);
                }
                channel.send(`Sadly, I was unable to get games from those sites : ${sources.join()}`);
            }
        });
    }
    else {
        Utils.log('Cannot fetch games -> channel null or undefined');
    }
}
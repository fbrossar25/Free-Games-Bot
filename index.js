const Discord = require('discord.js');
const Scheduler = require('node-schedule');
const { prefix, token, gamesChannelId, gamesCron } = require('./config.json');
const client = new Discord.Client();
const cronJobs = {};
const dateOptions = { month: 'numeric', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    if(typeof gamesChannelId === 'string') {
        client.channels.fetch(gamesChannelId).then(channel => schedule(channel));
    }
});

client.on('message', (msg) => {
    if (msg.content.startsWith(prefix)) {
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
        channel.send(`Next notifications will be on ${getDateString(date.toDate())}`);
    }
    else{
        channel.send('I\'ve got nothing planned out there');
    }
}

function cancelSchedule(channel) {
    if(cronJobs[channel.id]) {
        cronJobs[channel.id].cancel();
        channel.send('All scheduled tasks ar now canceled for this channel, my job here is done !');
        log(`Scheduled task cancelled for channel ${channel.name} (${channel.id})`);
    }
    else{
        channel.send('Nothing scheduled on this channel');
    }
}

function schedule(channel, cron = gamesCron) {
    if(cronJobs[channel.id]) {
        cronJobs[channel.id].reschedule(gamesCron);
    }
    else{
        cronJobs[channel.id] = Scheduler.scheduleJob(cron, () => fetchFreeGamesList(channel));
    }
    nextSchedule(channel);
}

function fetchFreeGamesList(channel, args) {
    if(channel) {
        log(`Fetching games for channel ${channel.name} (${channel.id})`);
        const messageToSend = `WIP : will search free games on ${Array.isArray(args) ? args.join() : 'Epic Games Store'}`;
        channel.send(messageToSend);
    }
    else {
        log('Cannot fetch games -> channel null or undefined');
    }
}

function log(msg) {
    console.log(`${getDateString()} - ${msg}`);
}

function getDateString(date = new Date()) {
    return date.toLocaleDateString('en-EN', dateOptions);
}
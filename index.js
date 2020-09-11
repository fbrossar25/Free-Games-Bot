const Discord = require('discord.js');
const { prefix, token, weeklyChannelId} = require('./config.json');
const client = new Discord.Client();
// const weeklyChannel = client.channels.get(weeklyChannelId);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg) => {
    if (msg.content.startsWith(prefix)) {
        command(parseCommand(msg));
    }
});

client.login(token);

function parseCommand(msg) {
    const args = msg.content.slice(prefix.length).trim().split(' ');
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
    case 'ping': {ping(cmd.channel); break;}
    case 'games': {games(cmd); break;}
    default: console.log(`Unknown command '${cmd.name}' received with args : ${cmd.args} `);
    }
}

function ping(channel) {
    channel.send('Pong!');
}

function games(cmd) {
    cmd.channel.send('WIP - Will check free games on epic games store');
}
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const client = new Discord.Client();

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
    const args = msg.content.substr(1).split(' ');
    return {
        msg: msg,
        channel: msg.channel,
        name: args[0],
        args:args.slice(1),
    };
}

function command(cmd) {
    switch (cmd.name) {
    case 'ping': {ping(cmd.channel); break;}
    default: console.log(`Unknown command '${cmd.name}' received with args : ${cmd.args} `);
    }
}

function ping(channel) {
    channel.send('Pong!');
}
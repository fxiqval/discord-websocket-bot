import WebSocket from 'ws';
import axios from 'axios';
import 'dotenv/config';

const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
let heartbeatInterval;
let lastSeq;

ws.on('open', () => {
    ws.send(JSON.stringify({
        op: 2,
        d: {
            token: process.env.TOKEN, // "Bot YOUR_TOKEN"
            intents: 1 << 0 | 1 << 9 | 1 << 15, // https://discord.com/developers/docs/topics/gateway#list-of-intents
            properties: { // https://discord.com/developers/docs/topics/gateway-events#identify-identify-connection-properties
                os: 'linux', // your os
                browser: 'chrome', // pretty much anything, if you want the online on mobile badge you need to set this to "Discord iOS" or "Discord Android",
                device: 'chrome' // also anything
            }
        }
    }));
});
ws.on('message', message => {
    const { d: data, t: event, op, s: seq } = JSON.parse(message);
    lastSeq = seq;
    switch (op) {
        case 10:
            heartbeatInterval = setInterval(() => {
                ws.send(JSON.stringify({
                    op: 1,
                    d: lastSeq || null
                }));
            }, data.heartbeat_interval);
            break;
    }
    switch (event) {
        case 'READY':
            console.log(`Logged in as ${data.user.username}.`);
            break;
        case 'MESSAGE_CREATE':
            handleMessage(data);
            break;
    }
});
ws.on('close', code => {
    clearInterval(heartbeatInterval);
    console.log(code);
});

async function handleMessage(message) {
    if (!message.content.startsWith(process.env.PREFIX) || !message.guild_id || message.author.bot) return;
    const [command, ...args] = message.content.slice(process.env.PREFIX.length).toLowerCase().split(/ +/);
    console.log({ command, args })
    switch (command) {
        case 'ping':
            await sendMessage(message.channel_id, {
                content: `Pong! Your arguments: \`${args.join(' ')}\``
            });
            break;
        }
    }
    
function sendMessage(channel_id, body) {
    return axios({
        url: `https://discord.com/api/v10/channels/${channel_id}/messages`,
        method: 'POST',
        data: body,
        headers: {
            Authorization: process.env.TOKEN
        },
        responseType: 'json'
    });
};

# Free-Games-Bot

Bot for discord that fetch free games with a schelued tasks using cron expression or simple weekly recurency rule based on D:HH:MM format and posting into specified channels.

## Installation
```bash
npm install
```
Depedencies :
- [discordJS](https://discord.js.org/?source=post_page---------------------------#/) to post messages and wait for commands
- [dayjs](https://day.js.org/) to ease date formatting
- [node-schedule](https://www.npmjs.com/package/node-schedule) to schedule notifications using cron expressions and recurency rules
- [axios](https://www.npmjs.com/package/axios) to make webservices calls to each games stores.

## How to add this bot in discord
First, [follow this guide](https://discordjs.guide/).

In discord, copy the channel Id [(requires discord dev mode)](https://www.discordia.me/en/developer-mode) where you want the bot to work, and paste it into `free-games-bot.json` config file, in channelsIds list. Now the bot will respond its command.

This bots needs those permissions in order to work properly :
 - Read messages
 - Send messages
 - Embed link
 - Read messages history
 - Mention everyone


## Usage
For each commands below, the channel id need to be into the channelsIds list of the `free-games-bot.json` config file in order for the bot to respond.

```
!games [options]
```
- Without any options, the bot will fetch free games on each programmed websites
- Options are :
  - ping : basic ping response
  - schedule : create a scheduled tasks which will run in the channel using weeklyAnnounce value in `free-games-bot.json` config file by default. If cron expression or simple D:HH:MM rule is provided, will attempt to use it or fallback to default rule defined in `free-games-bot.json` config file. See [cron expressions here](https://crontab.guru/every-day-at-1am) to learn more about cron.
  - cancel : cancel scheduled tasks for this channel
  - next : print when the next notofications will occur
  - help : print help about the bot's command with no arguments
  - usage : print info about all commands of the bot
  - sources : print the list of known sources

## Examples
![Example 1](./img/cancel.png)
![Example 2](./img/schedule.png)

## free-games-bot.json file

This file will be written with default values if it does not exists in the /conf directory of the container.
|Name|Description|Example value|
|---|---|---|
|token|Token of your boot, see [this](https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-token)|`4815162342`|
|channelsIds|List of channels ids where the bot is allowed to posts|`42,9001,4815162342`|
|channelsIdsToSchedule|List of channels ids where the bot will automatically schedule on startup. Those ids also needs to be on CHANNELS_IDS|`42,9001`|
|weeklyAnnounce|Expression used to schedule periodical verification and post of free games. In this exemple, each Thursday at 9pm, D:HH:MM format.|`4:21:00`|

## Environment variables

|Name|Description|Example value|
|---|---|---|
|CONF_DIR (Optional)|Directory where the free-games-bot.json file will be read. A default one will be written there if not present and the directory exists. Defaults to `/conf`. Not trailing `/`. |`/opt/free-games-bot`|
|TZ (Optional)|Timezone in which the bot will be running|`Europe/Paris`|

## Set timezone

- With Docker, run the container with an extra argument `-e TZ=France/Paris` to set a specific timezone, otherwise it will use the system default.
- With Node from a unix shell : `TZ=France/Paris node index.js`

## Running with npm

`npm run start`

## Running with Docker

TODO


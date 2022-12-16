const { SlashCommandBuilder } = require('discord.js');
const { config } = require('../config');
const { parseRule, SimpleRule, isValidRule } = require('../rule');
const Scheduler = require('node-schedule');
const { fetch } = require('../fetch');
const Utils = require('../utils');

const cronRegexp = /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,6}/;
const hardcodedDefaultRule = new SimpleRule(4, 18, 30);

/** Default rule to apply for jobs scheduling */
const weeklyAnnounceRule = typeof config.weeklyAnnounce === 'string'
    ? (config.weeklyAnnounce.match(cronRegexp) ? config.weeklyAnnounce : hardcodedDefaultRule)
    : parseRule(config.weeklyAnnounce, hardcodedDefaultRule);

/** @type {Map<string, import('node-schedule').Job>} */
const jobs = new Map();

/**
 * @param {import('discord.js').TextChannel} channel
 * @returns {string}
 */
function nextSchedule(channel) {
    let date = null;
    if (jobs.has(channel.id)) {
        date = jobs.get(channel.id).nextInvocation();
    }
    let message;
    if (date) {
        message = `Next notification will be on ${Utils.getDateString(date.toDate())}`;
    }
    else {
        message = 'I\'ve got nothing planned out there';
    }
    return message;
}


/**
 * @param {import('discord.js').TextChannel} channel
 */
async function executeFetchJob(channel) {
    Utils.log(`Scheduled job : Fetching games for channel ${channel.guild.name}#${channel.name} (${channel.guild.id}#${channel.id})`);

    let message = await fetch();
    message += '\n' + nextSchedule(channel);
    try {
        await channel.send(message);
    }
    catch (error) {
        Utils.logError('Error while replying', error);
    }
}

/**
 *
 * @param {string|SimpleRule} rule The cron or SimpleRule to schedule
 * @param {import('discord.js').TextChannel} channel
 * @param {boolean?} announce
 * @returns {Promise<string>} next schedule message
 */
async function doSchedule(rule, channel) {
    let job = jobs.get(channel.id);
    if (job) {
        job.cancel();
    }
    job = Scheduler.scheduleJob(typeof rule === 'string' ? rule : rule.toRecurrenceRule(), () => executeFetchJob(channel));
    const guild = await channel.client.guilds?.fetch(channel.guildId) ?? '<unknown>';
    const guildName = guild.name;
    if (job) {
        jobs.set(channel.id, job);
        Utils.log(`Scheduled notification on ${guildName}#${channel.name} (${channel.guildId}#${channel.id}), next one on ${Utils.getDateString(job.nextInvocation().toDate())}`);
    }
    else {
        const defaultRuleFailed = rule === weeklyAnnounceRule;
        Utils.log(`Unable to schedule notification on ${guildName}#${channel.name} (${channel.guildId}#${channel.id}), rescheduling to default ${defaultRuleFailed ? 'failed' : ''}`);
        if (defaultRuleFailed) return 'Unable to schedule notification, rescheduling to default failed';
        await schedule(weeklyAnnounceRule, channel);
    }
    return nextSchedule(channel);
}

/**
 * @param {string|SimpleRule} rule
 * @param {import('discord.js').TextChannel} channel
 * @returns {Promise<string>} The next schedule message
 */
async function schedule(rule, channel) {
    if (!rule) return;
    let parsedRule = null;
    if (typeof rule === 'string') {
        if (isValidRule(rule)) {
            // D:HH:MM
            parsedRule = parseRule(rule);
        }
        else if (rule.trim().match(cronRegexp)) {
            parsedRule = rule.trim();
        }
    }
    else if (rule instanceof SimpleRule) {
        parsedRule = rule;
    }
    return doSchedule(parsedRule ?? weeklyAnnounceRule, channel);
}

/**
 * @param {import('discord.js').TextChannel} channel
 * @returns {Promise<string>} The next schedule message
 */
async function cancel(channel) {
    const guild = await channel.client.guilds?.fetch(channel.guildId) ?? '<unknown>';
    const guildName = guild.name;
    const job = jobs.get(channel.id);
    if (job) {
        job.cancel();
        Utils.log(`Cancelled notification on ${guildName}#${channel.name} (${channel.guildId}#${channel.id})}`);
        return 'My job here is done !';
    }
    else {
        Utils.log(`Nothing to cancel on ${guildName}#${channel.name} (${channel.guildId}#${channel.id})}`);
        return 'Nothing to cancel here';
    }
}

/**
 * @typedef ScheduleFunctions
 * @property {(channel: import('discord.js').TextChannel) => string} nextSchedule
 * @property {(ruleString: string, channel: import('discord.js').TextChannel) => string} schedule
 * @property {() => void} gracefulShutdownSheculedJobs
 * @property {SimpleRule | string | null} weeklyAnnounceRule
 *
 * @typedef {import('../command-registering').CommandModule & ScheduleFunctions} ScheduleModule
 */

/** @type {ScheduleModule} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription(require('../../help.json')['schedule'][0])
        .addStringOption(option => option.setName('expr').setDescription('Cron or D:HH:MM expression').setRequired(true)),
    /** @type {import('../index').ExecuteFunction} execute */
    async execute(interaction) {
        await interaction.deferReply();
        const message = await schedule(interaction.options.getString('expr'), interaction.channel);
        await interaction.editReply(message);
    },
    schedule,
    nextSchedule,
    gracefulShutdownScheduledJobs() {
        Utils.log(`Canceling ${jobs.size} jobs`);
        for (const jobId of jobs.keys()) {
            jobs.get(jobId).cancel();
        }
    },
    weeklyAnnounceRule,
    cancel,
};
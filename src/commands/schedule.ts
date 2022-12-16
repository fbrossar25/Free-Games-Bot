import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    TextBasedChannel,
    TextChannel
} from 'discord.js';
import { config } from '../config';
import {parseRule, SimpleRule, isValidRule} from '../rule';
import * as Scheduler from 'node-schedule';
import { fetch } from '../fetch';
import * as Utils from '../utils';
import * as help from '../help.json';

const cronRegexp = /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,6}/;

/** Default rule to apply for jobs scheduling */
export const weeklyAnnounceRule: string | SimpleRule = config.weeklyAnnounce.match(cronRegexp)
    ? config.weeklyAnnounce
    : parseRule(config.weeklyAnnounce);

/** @type {Map<string, import('node-schedule').Job>} */
const jobs = new Map<string, Scheduler.Job>();

export function nextSchedule(channel: TextBasedChannel): string {
    let date = null;
    if (jobs.has(channel.id)) {
        date = jobs.get(channel.id)?.nextInvocation();
    }
    let message;
    if (date) {
        message = `Next notification will be on ${Utils.getDateString(date)}`;
    }
    else {
        message = 'I\'ve got nothing planned out there';
    }
    return message;
}


/**
 * @param channel
 */
export async function executeFetchJob(channel: TextChannel) {
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
 * @param rule The cron or SimpleRule to schedule
 * @param channel
 * @returns next schedule message
 */
export async function doSchedule(rule: string|SimpleRule, channel: TextChannel) {
    let job = jobs.get(channel.id);
    if (job) {
        job.cancel();
    }
    job = Scheduler.scheduleJob(typeof rule === 'string' ? rule : rule.toRecurrenceRule(), () => executeFetchJob(channel));
    const guild = await channel.client.guilds?.fetch(channel.guildId) ?? '<unknown>';
    const guildName = guild.name;
    if (job) {
        jobs.set(channel.id, job);
        Utils.log(`Scheduled notification on ${guildName}#${channel.name} (${channel.guildId}#${channel.id}), next one on ${Utils.getDateString(job.nextInvocation())}`);
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
 * @param rule
 * @param channel
 * @returns The next schedule message
 */
export async function schedule(rule: string|SimpleRule, channel: TextChannel): Promise<string> {
    if (!rule) return Promise.resolve('<error: missing rule>');
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
    else {
        parsedRule = rule;
    }
    return doSchedule(parsedRule ?? weeklyAnnounceRule, channel);
}

/**
 * @param channel
 * @returns The next schedule message
 */
export async function cancel(channel: TextChannel): Promise<string> {
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

export async function gracefulShutdownScheduledJobs() {
    Utils.log(`Canceling ${jobs.size} jobs`);
    for (const jobId of jobs.keys()) {
        jobs.get(jobId)?.cancel();
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription(help.schedule[0])
        .addStringOption(option => option.setName('expr').setDescription('Cron or D:HH:MM expression').setRequired(true)),
    /** @type {import('../index').ExecuteFunction} execute */
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const expr = interaction.options.getString('expr');
        if(!expr) {
            await interaction.editReply("missing 'expr' parameter");
            return;
        }
        if(!interaction.channel) {
            await interaction.editReply("missing 'channel' in interaction");
            return;
        }
        const message = await schedule(expr, interaction.channel as TextChannel);
        await interaction.editReply(message);
    }
}
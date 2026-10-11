import { type TextBasedChannel, TextChannel } from "discord.js";
import * as Scheduler from "node-schedule";
import { fetchAll } from "./fetch.ts";
import * as Utils from "./utils.ts";
import { config } from "./config.ts";

const jobs = new Map<string, Scheduler.Job>();

export function nextSchedule(channel: TextBasedChannel): string {
    let date = null;
    if (jobs.has(channel.id)) {
        date = jobs.get(channel.id)?.nextInvocation();
    }
    let message;
    if (date) {
        message = `Next notification will be on ${Utils.getDateString(date)}`;
    } else {
        message = "I've got nothing planned out there";
    }
    return message;
}

/**
 * @param channel
 */
export async function executeFetchJob(channel: TextChannel) {
    Utils.log(
        `Scheduled job : Fetching games for channel ${channel.guild.name}#${channel.name} (${channel.guild.id}#${channel.id})`
    );
    try {
        const [embed, n] = await fetchAll();
        if (n !== 0) {
            // Juste send notifications when there is something new to notify
            await channel.send({ content: "@everyone", embeds: [embed], allowedMentions: { parse: [ "everyone" ] } });
        }
    } catch (error) {
        Utils.logError("Error while replying", error);
    }
}

const rule = new Scheduler.RecurrenceRule();
if (config.dev) {
    rule.second = [0, 10, 20, 30, 40, 50];
} else {
    rule.second = 0;
    rule.minute = 0;
    rule.hour = [9, 12, 15, 18, 21];
}

/**
 *
 * @param rule The cron or SimpleRule to schedule
 * @param channel
 * @returns next schedule message
 */
export async function doSchedule(channel: TextChannel) {
    let job = jobs.get(channel.id);
    if (job) {
        job.cancel();
    }
    job = Scheduler.scheduleJob(rule, () => executeFetchJob(channel));
    const guild =
        (await channel.client.guilds?.fetch(channel.guildId)) ?? "<unknown>";
    const guildName = guild.name;
    if (job) {
        jobs.set(channel.id, job);
        Utils.log(
            `Scheduled notification on ${guildName}#${channel.name} (${channel.guildId}#${channel.id}), next one on ${Utils.getDateString(job.nextInvocation() ?? undefined)}`
        );
    } else {
        Utils.log(
            `Unable to schedule notification on ${guildName}#${channel.name} (${channel.guildId}#${channel.id})`
        );
        return;
    }
}

export async function gracefulShutdownScheduledJobs() {
    Utils.log(`Canceling ${jobs.size} jobs`);
    for (const jobId of jobs.keys()) {
        jobs.get(jobId)?.cancel();
    }
}

import { type TextChannel, ChannelType } from "discord.js";
import * as Scheduler from "node-schedule";
import { fetchAll } from "./fetch.ts";
import * as Utils from "./utils.ts";
import { config } from "./config.ts";
import type { BotClient } from "./index.ts";

const jobs = new Map<string, Scheduler.Job>();

export function nextSchedule(channel: TextChannel): string {
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
export async function executeFetchJob(client: BotClient) {
    const channels: TextChannel[] = [];
    for (const guildId in config.guilds) {
        for (const channelId of config.guilds[guildId]) {
            if (!channelId) continue;
            Utils.log(`Searching channel ${guildId}#${channelId}`);
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                Utils.log(`Channel ${guildId}#${channelId} not found`);
                continue;
            } else if (channel.type !== ChannelType.GuildText) {
                Utils.log(
                    `Channel ${guildId}#${channelId} is not a text channel`
                );
                continue;
            }
            channels.push(channel);
        }
    }
    try {
        const [embed, n] = await fetchAll();
        if (n !== 0) {
            Utils.log(`Notifying ${channels.length} channels`);
            // Just send notifications when there is something new to notify
            for (const channel of channels) {
                Utils.log(
                    `Scheduled job : Sending games for channel ${channel.guild.name}#${channel.name} (${channel.guild.id}#${channel.id})`
                );
                await channel.send({
                    content: "@everyone",
                    embeds: [embed],
                    allowedMentions: { parse: ["everyone"] },
                });
            }
        } else {
            Utils.log(`Nothing new to notify`);
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
 * @returns next schedule message
 */
export async function doSchedule(client: BotClient) {
    let job = jobs.get("scheduled-notifications");
    if (job) {
        job.cancel();
    }
    job = Scheduler.scheduleJob(rule, () => executeFetchJob(client));
    if (job) {
        jobs.set("scheduled-notifications", job);
        Utils.log(
            `Scheduled notification, next one on ${Utils.getDateString(job.nextInvocation() ?? undefined)}`
        );
    } else {
        Utils.log(`Unable to schedule notification`);
        return;
    }
}

export async function gracefulShutdownScheduledJobs() {
    Utils.log(`Canceling ${jobs.size} jobs`);
    for (const jobId of jobs.keys()) {
        jobs.get(jobId)?.cancel();
    }
}

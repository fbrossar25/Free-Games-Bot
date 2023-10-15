import * as Utils from './utils';
import * as fs from 'fs';
import * as process from "process";

// loading config
const configDir = process.env.CONF_DIR ?? `${process.cwd() ?? ''}/conf`;
const configPath = `${configDir}/free-games-bot.json`;

Utils.log(`Using config dir ${configDir}`);
if (!fs.existsSync(configDir)) {
    throw new Error(`Config dir ${configDir} does not exists.`);
}

Utils.log(`Reading ${configPath}`);
if (!fs.existsSync(configPath)) {
    Utils.log(`Writing empty default file into ${configPath}`);
    fs.copyFileSync('../free-games-bot.empty.json', configPath);
}

export type ChannelScedule = {
    id: string;
    schedule: string;
}

export type GuildSchedule = Array<string | ChannelScedule>

export type ConfigObject = {
    /**
     * command prefix
     * @deprecated since using slash commands
    */
    prefix: string;
    /**
     * Name of the command
     * @deprecated since using slash commands
     */
    command: string;
    /** Discord app Id */
    applicationId: string;
    /** Discord app token */
    token: string;
    /** Map of channels Ids, by their guild Ids
     * @example
     * {
     *  "123": ["45", "6"],
     *  "7": ["90"]
     * }
     */
    guilds: { [guildId: string]: GuildSchedule };
    /**
     * Default value of weekly announce to be set for each channel in guilds object
     * in D:HH:MM format with optional leading 0 for hours
     */
    weeklyAnnounce: string;
    dev?: boolean;
}

/**
 * Bot's configuration JSON
 */
export const config: ConfigObject = JSON.parse(fs.readFileSync(configPath, "utf8"));

if(process.env.DEV === ('true' || '1')) {
    config.dev = true;
}
export default config;
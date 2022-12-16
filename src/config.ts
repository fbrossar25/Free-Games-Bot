import * as Utils from './utils';
import * as fs from 'fs';

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
    fs.writeFileSync(configPath, JSON.stringify(require('../free-games-bot.empty.json'), null, 4));
}

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
    guilds: { [guildId: string]: string[] };
    /** 
     * Default value of weekly annouce to be set for each channel in guilds object 
     * in D:HH:MM format with optional leading 0 for hours
     */
    weeklyAnnounce: string;
}

/**
 * Bot's configuration JSON
 */
export const config: ConfigObject = require(configPath);
export default config;
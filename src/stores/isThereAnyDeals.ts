import { Store } from "../store.ts";
import { XMLParser } from "fast-xml-parser";
import { log, logError } from "../utils.ts";

const parser = new XMLParser();

export type ITADGame = {
    /** Unique RSS giveaway id */
    guid: string;
    /** Game redeem URL */
    url: string;
    /** Game title */
    title: string;
};

export type ITADStoreResponseData = {
    /** RSS feed XML string */
    xml: string;
};

type RSSFeed = {
    rss: {
        channel: {
            title: string;
            description: string;
            link: string;
            item: {
                guid: string;
                title: string;
                link: string;
                description: string;
            }[];
        };
    };
};

/**
 * Parse RSS feed and return list of ITAD games
 * Note: This is a simple implementation that parses the XML string directly.
 * The URL extraction logic is simplified for testing purposes.
 */
const parseRssFeed = (response: string): ITADGame[] => {
    log(`feed received :\n${JSON.stringify(response, null, 4)}`);
    let xml: RSSFeed | null = null;
    try {
        xml = parser.parse(response);
    } catch (error) {
        logError("Error parsing the XML string:", error);
        return [];
    }

    if (!Array.isArray(xml?.rss?.channel?.item)) {
        return [];
    }

    return xml.rss.channel.item.map((item) => {
        // Extract URL from description field
        let url = "";
        log(`item found :\n${JSON.stringify(item, null, 4)}`);
        if (item.description) {
            // Simple regex to extract the URL from the description
            const hrefMatch = item.description.match(
                /href\s*=\s*["']([^"']*)["']/
            );
            console.log();
            if (hrefMatch && hrefMatch[1]) {
                url = hrefMatch[1];
            }
        }

        return {
            guid: item.guid || "",
            url,
            title: item.title || "",
        };
    });
};

/**
 * Check if a game is free (all games in ITAD feed are free)
 */
const isFreeFct = (): boolean => {
    return true;
};

/**
 * Get game name from ITAD game */
const gameNameFct = (game: ITADGame): string => {
    return game.title;
};

/**
 * Get game URL from ITAD game */
const gameUrlFct = (game: ITADGame): string => {
    return game.url;
};

export const itadStore = new Store<ITADGame, string>(
    "itad",
    "IsThereAnyDeal",
    "https://isthereanydeal.com/feeds/FR/giveaways.rss",
    parseRssFeed,
    isFreeFct,
    gameNameFct,
    gameUrlFct
);

export default itadStore;

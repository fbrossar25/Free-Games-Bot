import { Store } from "../store.ts";
import { config } from "../config.ts";
import { getGameIdsFromDb } from "../db.ts";

// From API https://api.isthereanydeal.com/service/shops/map/v1
// 3 - Amazon
// 4 - Blizzard
// 16 - Epic Game Store
// 35 - GOG
// 37 - Humble Store
// 48 - Microsoft Store
// 52 - EA Store
// 61 - Steam
// 62 - Ubisoft Store
/** List of shop ids to include in discord messages, giveways from other shops are filtered out */
const ITADShopsId = [3, 4, 16, 35, 37, 48, 52, 60, 61, 62];

export type ITADGame = {
    /** Unique giveaway id */
    id: number;
    /** Game redeem URL */
    url: string;
    /** Game title */
    title: string;
    /** UTC Date format with time offset  */
    expiry: string;
};

type ITADGiveaway = {
    id: number;
    title: string;
    shop?: {
        id: number;
        name: string;
    };
    url: string;
    details: string;
    isMature: boolean;
    publish: string;
    /** UTC Date format with time offset  */
    expiry: string;
    note: string;
    games: {
        id: string;
        slug: string;
        title: string;
        type: "game" | "dlc";
        mature: boolean;
    }[];
};

export type ITADAPIResponseData = ITADGiveaway[];

/**
 * Parse RSS feed and return list of ITAD games
 * Note: This is a simple implementation that parses the XML string directly.
 * The URL extraction logic is simplified for testing purposes.
 */
const parseApiResponse = (
    response: ITADAPIResponseData,
    includesAlreadyNotified: boolean
): ITADGame[] => {
    if (!Array.isArray(response)) {
        return [];
    }
    let giveaways = response
        .filter(
            (item) =>
                typeof item.shop?.id === "number" &&
                ITADShopsId.includes(item.shop.id)
        )
        .map((item) =>
            item.games
                .filter((g) => g.type === "game")
                .map((g) => ({
                    id: item.id,
                    url: item.url,
                    title: g.title,
                    expiry: item.expiry,
                }))
        )
        .flat();
    if (includesAlreadyNotified) return giveaways;
    const notifiedIds = getGameIdsFromDb();
    return giveaways.filter((g) => !notifiedIds.includes(g.id));
};

export const itadStore = new Store<ITADGame, ITADAPIResponseData>(
    "itad",
    "IsThereAnyDeal",
    "https://api.isthereanydeal.com/giveaways/v1",
    parseApiResponse,
    () => true,
    (game: ITADGame) => game.title,
    (game: ITADGame) => game.url,
    (game: ITADGame) => game.expiry,
    (game: ITADGame) => game.id,
    { key: config.isThereAnyDealsAPIKey }
);

export default itadStore;

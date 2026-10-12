import * as Utils from "./utils.ts";
import axios, { AxiosError, type AxiosResponse } from "axios";
import { config } from "./config.ts";
import { getGameIdsFromDb } from "./db.ts";

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

/** Description of a free game */
export type FreeGame = {
    /** unique id for giveaway */
    id: number;
    /** Human-friendly name of the game */
    name: string;
    /** Shop name where to redeem the game (e.g. Steam, Epic Games Store) */
    shop: string;
    /** Url to the game on the source website */
    url: string;
    /** Date on UTC format with offset expiration date */
    expiry: string;
};

/** List of FreeGame */
export type FreeGames = FreeGame[];

/** Error thrown when a fetch operation failed */
export class FetchError {
    /** Error message */
    public error: string;
    /** Source of the error (e.g. epic) */
    public source: string;

    constructor(error: string, source: string) {
        this.error = error;
        this.source = source;
    }
}

export class FetchResult {
    public games: FreeGames;
    constructor(games: FreeGames) {
        this.games = games;
    }
}

/** Store where to look for free games */
class IsThereAnyDeal {
    public url = "https://api.isthereanydeal.com/giveaways/v1";
    public queryParams = { key: config.isThereAnyDealsAPIKey };

    public callUrl(): Promise<AxiosResponse<ITADAPIResponseData>> {
        Utils.log(`[IsThereAnyDeal] Calling ${this.url}`);
        if (this.queryParams) {
            return axios.get<ITADAPIResponseData>(this.url, {
                params: this.queryParams,
            });
        }
        return axios.get<ITADAPIResponseData>(this.url);
    }

    /**
     * Parse RSS feed and return list of ITAD games
     * Note: This is a simple implementation that parses the XML string directly.
     * The URL extraction logic is simplified for testing purposes.
     */
    parseApiResponse(
        response: ITADAPIResponseData,
        includesAlreadyNotified: boolean
    ): FreeGames {
        if (!Array.isArray(response)) {
            return [];
        }
        let giveaways: FreeGames = response
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
                        name: g.title,
                        shop: item.shop?.name ?? "",
                        expiry: item.expiry,
                    }))
            )
            .flat();
        if (includesAlreadyNotified) return giveaways;
        const notifiedIds = getGameIdsFromDb();
        return giveaways.filter((g) => !notifiedIds.includes(g.id));
    }

    /**
     * Fetch free games
     */
    public async fetch(
        includesAlreadyNotified = false
    ): Promise<FetchResult | FetchError> {
        let response: AxiosResponse<ITADAPIResponseData>;
        try {
            response = await this.callUrl();
        } catch (error) {
            if (error instanceof AxiosError) {
                Utils.logError(
                    `[IsThereAnyDeal] Error ${error.response?.status ?? "<unknown status>"}`,
                    error
                );
            } else {
                Utils.logError(`[IsThereAnyDeal] Unknown error`, error);
            }
            return new FetchError(
                "itad",
                `[IsThereAnyDeal] Cannot fetch games (see logs)`
            );
        }

        // free games detection algorithm
        try {
            if (!response) {
                throw new Error(`No response received`);
            }
            if (!response.data) {
                throw new Error(
                    `No data in axios response:\n${JSON.stringify(response, null, 4)}`
                );
            }
            const freeGames = this.parseApiResponse(
                response.data,
                includesAlreadyNotified
            );
            Utils.log(
                `[IsThereAnyDeal] ${freeGames.length} free games found from response`
            );
            return { games: freeGames };
        } catch (error) {
            Utils.logError(
                `[IsThereAnyDeal] Error while checking free games`,
                error
            );
            return new FetchError(
                "itad",
                `[IsThereAnyDeal] Error while checking free games (see logs)`
            );
        }
    }
}

export const itad = new IsThereAnyDeal();

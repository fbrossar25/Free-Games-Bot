import * as Utils from "./utils.ts";
import axios, { AxiosError, type AxiosResponse } from "axios";
import { config } from "./config.ts";
import { addGiveawaysIdsToDb, getGiveawaysIdsFromDb } from "./db.ts";

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
/** ITADGame.tags */
const f2pTag = "Free to Play";

type ITADGame = {
    id: string;
    tags: string[];
};

type ITADGiveaway = {
    /** Id of the giveaway */
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
        /** UUID of the game, corresponds to the id field of {@link ITADGame} */
        id: string;
        slug: string;
        title: string;
        type: "game" | "dlc";
        mature: boolean;
    }[];
};

export type ITADGiveaways = ITADGiveaway[];

/** Description of a free game */
export type FreeGame = {
    /** unique id for giveaway */
    id: number;
    /** UUID of the game, corresponds to the id field of {@link ITADGame} */
    gameId: string;
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
    public urlDetail = "https://api.isthereanydeal.com/games/info/v2";
    public queryParams = { key: config.isThereAnyDealsAPIKey };

    public fetchGiveaways(): Promise<AxiosResponse<ITADGiveaways>> {
        Utils.log(`[IsThereAnyDeal] Calling ${this.url}`);
        return axios.get<ITADGiveaways>(this.url, {
            params: this.queryParams,
        });
    }

    public fetchGameInfo(id: ITADGame["id"]) {
        return axios.get<ITADGame>(this.urlDetail, {
            params: { ...this.queryParams, id: id },
        });
    }

    /**
     * Parse RSS feed and return list of ITAD games
     * Note: This is a simple implementation that parses the XML string directly.
     * The URL extraction logic is simplified for testing purposes.
     */
    async parseApiResponse(
        response: ITADGiveaways,
        includesAlreadyNotified: boolean
    ) {
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
                        gameId: g.id,
                        url: item.url,
                        name: g.title,
                        shop: item.shop?.name ?? "",
                        expiry: item.expiry,
                    }))
            )
            .flat();
        if (!includesAlreadyNotified) {
            giveaways = giveaways.filter((g) => !notifiedIds.includes(g.id));
            const notifiedIds = getGiveawaysIdsFromDb();
        }
        const ignoredGivewaysIds: number[] = [];
        for (let i = 0; i < giveaways.length; i++) {
            const isF2P = await this.isF2P(giveaways[i]);
            // include the giveaway by default
            if (!(isF2P instanceof FetchError) && isF2P) {
                giveaways.splice(i, 1);
                ignoredGivewaysIds.push(giveaways[i].id);
            }
        }
        addGiveawaysIdsToDb(ignoredGivewaysIds);

        return giveaways;
    }

    async isF2P(game: FreeGame): Promise<boolean | FetchError> {
        Utils.log(`[IsThereAnyDeal] searching details for game ${game.gameId}`);
        try {
            const info = await this.fetchGameInfo(game.gameId);
            return info.data.tags.includes(f2pTag);
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
                `[IsThereAnyDeal] Cannot fetch game infos of ${game.gameId} (see logs)`
            );
        }
    }

    /**
     * Fetch free games
     */
    public async fetch(
        includesAlreadyNotified = false
    ): Promise<FetchResult | FetchError> {
        let response: AxiosResponse<ITADGiveaways>;
        try {
            response = await this.fetchGiveaways();
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
            const freeGames = await this.parseApiResponse(
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

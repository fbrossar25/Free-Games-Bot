import * as Utils from './utils';
import {AxiosError, AxiosResponse} from 'axios';
import axios from 'axios';

/** Extract a list of games of type T from a http response of type R*/
export type GamesExtractorFunction<T, R = any> = (response: R) => T[];
/** For a game of type T, indicate if this game is free. */
export type IsFreeFunction<T> = (game: T) => boolean;

/** Extract a specific info from a game of type T */
export type GameInfoExtractorFunction<T> = (game: T) => string;

/** Description of a free game */
export type FreeGame = {
    /** Human-friendly name of the game */
    name: string,
    /** Source of the game (e.g. epic) */
    source: string,
    /** Url to the game on the source website */
    url: string
}

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
export class Store<T = unknown, R = unknown> {

    public source: string;
    public humanSource: string;
    public url: string;
    public gamesFromResponseFct: GamesExtractorFunction<T, R>;
    public isFreeFct: IsFreeFunction<T>;
    public gameNameFct: GameInfoExtractorFunction<T>;
    public gameUrlFct: GameInfoExtractorFunction<T>;

    /**
     * @param source Unique name of the source
     * @param humanSource Name of the source to display
     * @param url The url to call
     * @param gamesFromResponseFct A function that returns games list from url call response
     * @param isFreeFct A function that returns if a game is free or not
     * @param gameNameFct A function that returns a game name
     * @param gameUrlFct A function that returns a game URL
     */
    constructor(source: string, humanSource: string, url: string, gamesFromResponseFct: GamesExtractorFunction<T, R>, isFreeFct: IsFreeFunction<T>, gameNameFct: GameInfoExtractorFunction<T>, gameUrlFct: GameInfoExtractorFunction<T>) {
        this.source = source;
        this.humanSource = humanSource;
        this.url = url;
        this.gamesFromResponseFct = gamesFromResponseFct;
        this.isFreeFct = isFreeFct;
        this.gameNameFct = gameNameFct;
        this.gameUrlFct = gameUrlFct;
    }

    public callUrl(): Promise<AxiosResponse<R>> {
        Utils.log(`[${this.humanSource}] Calling ${this.url}`);
        return axios.get<R>(this.url);
    }

    /**
     * Fetch free games
     */
    public async fetch(): Promise<FetchResult|FetchError> {
        let response: AxiosResponse<R>;
        try {
            response = await this.callUrl();
        } catch (error) {
            if (error instanceof AxiosError) {
                Utils.logError(`[${this.humanSource}] Error ${error.response?.status ?? '<unknown status>'}`, error);
            } else {
                Utils.logError(`[${this.humanSource}] Unknown error`, error);
            }
            return new FetchError(
                this.source,
                `[${this.humanSource}] Cannot fetch games (see logs)`
            );
        }

        // free games detection algorithm
        try {
            if (!response) {
                throw new Error(`No response received`);
            }
            if (!response.data) {
                throw new Error(`No data in axios response:\n${JSON.stringify(response, null, 4)}`);
            }
            const games = this.gamesFromResponseFct(response.data);
            Utils.log(`[${this.humanSource}] ${games.length} games found from response`);
            const freeGames = [];
            for (const game of games) {
                if (this.isFreeFct(game)) {
                    freeGames.push({
                        source: this.source,
                        name: this.gameNameFct(game),
                        url: this.gameUrlFct(game),
                    });
                }
            }
            Utils.log(`[${this.humanSource}] ${freeGames.length} free games found from response`);
            return {games: freeGames};
        } catch (error) {
            Utils.logError(`[${this.humanSource}] Error while checking free games`, error);
            return new FetchError(
                this.source,
                `[${this.humanSource}] Error while checking free games (see logs)`
            );
        }
    }
}

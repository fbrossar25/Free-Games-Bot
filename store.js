const Utils = require('./utils');
const axios = require('axios').default;

/**
 * @callback GamesExtractorFunction
 * @template T Structure  of a game returned by API url call response
 * @param {any} reponse Response from url call
 * @returns {T[]} Games list. Each objects structure depends on called API.
 */

/**
 * @callback IsFreeFunction
 * @template T Structure  of a game returned by API url call response
 * @param {T} game Game from list extracted using a GamesExtractorFunction
 * @returns {boolean} True if the game is free (i.e. to be notified on discord), false otherwise
 */

/**
 * @callback GameInfoExtractorFunction
 * @template T Structure  of a game returned by API url call response
 * @param {T} game Game from list extracted using a GamesExtractorFunction
 * @returns {string} An info from the game
 */

/**
 * @typedef FreeGame
 * @property {string} name
 * @property {string} source
 * @property {string} url
 */
/**
 * @typedef FetchError
 * @property {string} error
 * @property {string} source
 */

/**
 * @typedef FreeGames
 * @property { FreeGame[] } games
 */

/**
 * @template T Structure  of a game returned by API url call response
 */
module.exports = class Store {
    /**
     * @contructor
     * @param {string} source Unique name of the source
     * @param {string} humanSource Name of the source to display
     * @param {string} url The url to call
     * @param {GamesExtractorFunction<T>} gamesFromResponseFct A function that returns games list from url call response
     * @param {IsFreeFunction<T>} isFreeFct A function that returns if a game is free or not
     * @param {GameInfoExtractorFunction<T>} gameNameFct A function that returns a game name
     * @param {GameInfoExtractorFunction<T>} gameUrlFct A function that returns a game URL
     */
    constructor(source, humanSource, url, gamesFromResponseFct, isFreeFct, gameNameFct, gameUrlFct) {
        this.source = source;
        this.humanSource = humanSource;
        this.url = url;
        this.gamesFromResponseFct = gamesFromResponseFct;
        this.isFreeFct = isFreeFct;
        this.gameNameFct = gameNameFct;
        this.gameUrlFct = gameUrlFct;
    }

    /** @returns {Promise<AxiosResponse<any>>} */
    callUrl() {
        Utils.log(`[${this.humanSource}] Calling ${this.url}`);
        return axios.get(this.url);
    }

    /**
     * Fetch free games
     * @returns {Promise<FreeGames|FetchError>}
     */
    async fetch() {
        let response;
        try {
            response = await this.callUrl();
        }
        catch (error) {
            Utils.logError(`[${this.humanSource}] Error ${error.response?.status ?? '<unknown status>'}`, error);
            return {
                source: this.source,
                error: `[${this.humanSource}] Cannot fetch games (see logs)`,
            };
        }

        // free games detection algorithm
        try {
            const games = this.gamesFromResponseFct(response);
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
            return { games: freeGames };
        }
        catch (error) {
            Utils.logError(`[${this.humanSource}] Error while checking free games`, error);
            return {
                source: this.source,
                error: `[${this.humanSource}] Error while checking free games (see logs)`,
            };
        }
    }
};

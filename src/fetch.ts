import * as Utils from './utils';
import {FetchError, FetchResult, FreeGames} from "./store";
import { epicGameStore } from "./stores/epicStore";
import {gog} from "./stores/gog";

const stores = [
    epicGameStore,
    gog
];

function extractGamesAndErrors(fetchResults: PromiseFulfilledResult<FetchResult|FetchError>[]): {games: FreeGames, errors: FetchError[]} {
    return fetchResults.reduce<{games: FreeGames, errors: FetchError[]}>((acc, r) => {
        const value = r.value;
        if ('error' in value) {
            acc.errors.push(value);
        } else {
            for (const game of value.games) {
                acc.games.push(game);
            }
        }
        return acc;
    }, {games: [], errors: []});
}

/**
 * Fetch free games from all sources and returns the message to send in discord
 */
export async function fetchAll() {
    // Calling each stores
    const fetchPromises = stores.map(store =>
        store.fetch(),
    );

    // Merging each stores responses
    let fetchResults: PromiseFulfilledResult<FetchResult|FetchError>[] = [];
    try {
        const promisesResults = await Promise.allSettled(fetchPromises);
        fetchResults = promisesResults.filter(p => p.status === "fulfilled") as PromiseFulfilledResult<FetchResult|FetchError>[];
    } catch (error) {
        Utils.logError('Error while fetching games', error);
        try {
            return `:exploding_head: I was unable to fetch fetch games from those sources : ${stores.map(s => s.humanSource)} :exploding_head:`;
        } catch (error2) {
            Utils.logError('Error while replying with an error message', error2);
        }
    }

    const { games, errors } = extractGamesAndErrors(fetchResults);

    const lines = [];
    if (games?.length <= 0) {
        lines.push('No free games for today :(');
    } else {
        lines.push('Free games this week !');
        for (const game of games) {
            lines.push(`${game.name} ${game.url}`);
        }
    }

    if (errors.length > 0) {
        const sources = [];
        for (const error of errors) {
            sources.push(error.source);
        }
        lines.push(`Sadly, I was unable to get games from those sites : ${sources.join()}`);
    }
    return lines.join('\n');
}
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Utils from './utils';
import {FetchError, FetchResult, FreeGames, Store} from "./store";

const stores: Store[] = [];
const storesPath = path.join(__dirname, 'stores');
Utils.log(`Importing stores from folder ${storesPath}`);
const storeFiles = fs.readdirSync(storesPath).filter(file => file.endsWith('.js'));

const imports: Promise<Store>[] = storeFiles.map(f => path.join(storesPath, f))
    .map(p => import(p));
Promise.allSettled(imports)
    .then(imports => {
        // failed imports
        imports.filter(i => i.status === "rejected").forEach(rejection => Utils.logError(`Import rejected`, rejection));
        // populating storesMap
        (imports.filter(i => i.status === "fulfilled" && i.value) as PromiseFulfilledResult<Store>[])
            .map(i => i.value)
            .forEach((store: Store) => {
                stores.push(store);
                Utils.log(`Store  ${store.source} - ${store.humanSource} imported`);
            });
    });

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
export async function fetch() {
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
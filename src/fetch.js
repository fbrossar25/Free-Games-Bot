const fs = require('node:fs');
const path = require('node:path');
const Utils = require('./utils');

const storesMap = new Map();
/** @type {import('./store')[]} */
const stores = [];
const storesPath = path.join(__dirname, 'stores');
Utils.log(`Importing stores from folder ${storesPath}`);
const storeFiles = fs.readdirSync(storesPath).filter(file => file.endsWith('.js'));

for (const file of storeFiles) {
    const filePath = path.join(storesPath, file);
    /** @type {import('./store')} */
    const store = require(filePath);
    stores.push(store);
    storesMap.set(store.source, store);
    Utils.log(`Store  ${store.source} - ${store.humanSource} imported`);
}

/**
 * @returns {string} the message to send
 */
async function fetch() {
    // Calling each stores
    const fetchPromises = stores.map(store =>
        store.fetch(),
    );
    // Merging each stores reponses
    let fetchResults = [];
    try {
        fetchResults = await Promise.allSettled(fetchPromises);
    }
    catch (error) {
        Utils.logError('Error while fetching games', error);
        try {
            return `:exploding_head: I was unable to fetch fetch games frome those sources : ${stores.map(s => s.humanSource)} :exploding_head:`;
        }
        catch (error2) {
            Utils.logError('Error while replying with an error message', error2);
        }
    }
    const result = {
        games: [],
        errors: [],
    };
    for (const fetchResult of fetchResults) {
        const value = fetchResult.value;
        if (value.error) {
            result.errors.push({
                source: value.source,
                message: value.error,
            });
        }
        else {
            for (const game of value.games) {
                result.games.push(game);
            }
        }
    }

    const lines = [];
    if (result.games?.length <= 0) {
        lines.push('No free games for today :(');
    }
    else {
        lines.push('Free games this week !');
        for (const game of result.games) {
            lines.push(`${game.name} ${game.url}`);
        }
    }

    if (result.errors?.length > 0) {
        const sources = [];
        for (const error of result.errors) {
            sources.push(error.source);
        }
        lines.push(`Sadly, I was unable to get games from those sites : ${sources.join()}`);
    }
    return lines.join('\n');
}

module.exports.fetch = fetch;
const Utils = require('./utils');
const { epicStore, Store } = require('./stores');
/**
 * @type Map<string, Store>
 */
const stores = {
    'epic': epicStore
};
/**
 * @type string[]
 */
const knownSources = Object.keys(stores);

function unique(value, index, self) {
    return self.indexOf(value) === index;
}

function formatSources(sources) {
    const usableSources = Array.isArray(sources) && sources.length > 0 ? sources : knownSources;
    return usableSources.map(s => s.trim().toLowerCase()).filter(unique);
}

module.exports.knownSources = knownSources;
module.exports.stores = stores;

module.exports.fetch = (sources) => {
    return new Promise((success) => {
        const fetchPromises = [];

        // Preparing calls to each stores
        formatSources(sources).forEach(source => {
            if(source in stores) {
                fetchPromises.push(stores[source].fetch());
            }
            else {
                fetchPromises.push({
                    source:source,
                    error: `Unknown source named '${source}'`,
                });
            }
        });
        // Merging each stores reponses
        Promise.allSettled(fetchPromises).then((fetchResults) => {
            const result = {
                games: [],
                errors: [],
            };
            for(const fetchResult of fetchResults) {
                const value = fetchResult.value;
                if(value.error) {
                    result.errors.push({
                        source: value.source,
                        message: value.error,
                    });
                }
                else {
                    for(const game of value.games) {
                        result.games.push(game);
                    }
                }
            }
            Utils.log(`Free games found : ${JSON.stringify(result)}`);
            success(result);
        });
    });
};
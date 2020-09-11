const Utils = require('./utils');
const axios = require('axios');

function unique(value, index, self) {
    return self.indexOf(value) === index;
}

function fetchFrom(source) {
    switch(source) {
    case 'epic':
    default:
        return fetchFromEpic();
    }
}

module.exports.fetch = (sources = ['epic']) => {
    return new Promise((success) => {
        const fetchPromises = [];

        // Making calls to each webservices
        sources.map(source => {
            source.trim().toLowerCase();
        }).filter(unique).forEach((source) => {
            fetchPromises.push(fetchFrom(source));
        });

        // Merging each webservices
        Promise.allSettled(fetchPromises).then((fetchResults) => {
            const result = {
                games: [],
                errors: [],
            };
            for(const fetchResult of fetchResults) {
                const value = fetchResult.value;
                Utils.log(`fetchResult value : ${JSON.stringify(value)}`);
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
            success(result);
        });
    });
};

function fetchFromEpic() {
    return new Promise((success) => {
        axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR')
            .then(response => {
                const elements = response.data.data.Catalog.searchStore.elements;
                const freeGames = [];
                for(const el of elements) {
                    if(el.price.totalPrice.discountPrice === 0) {
                        freeGames.push({
                            source: 'epic',
                            name: el.title,
                            url: `https://www.epicgames.com/store/fr/product/${el.productSlug}`,
                        });
                    }
                }
                success({
                    games: freeGames,
                });
            })
            .catch(error => {
                Utils.log(`Error ${error.response.status} from Epic Games Store : ${JSON.stringify(error)}`);
                success({
                    source: 'epic',
                    error: 'Cannot fetch games from Epic Games Store (see logs)',
                });
            });
    });
}
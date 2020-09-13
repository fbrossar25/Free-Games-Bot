const Utils = require('./utils');
const axios = require('axios');

class Store {
    constructor(source, humanSource, url, gamesFromResponseFct, isFreeFct, gameNameFct, gameUrlFct) {
        this.source = source;
        this.humanSource = humanSource;
        this.url = url;
        this.gamesFromResponseFct = gamesFromResponseFct;
        this.isFreeFct = isFreeFct;
        this.gameNameFct = gameNameFct;
        this.gameUrlFct = gameUrlFct;
    }

    fetch() {
        return new Promise((success) => {
            axios.get(this.url)
                .then(response => {
                    const games = this.gamesFromResponseFct(response);
                    const freeGames = [];
                    for(const game of games) {
                        if(this.isFreeFct(game)) {
                            freeGames.push({
                                source: this.source,
                                name: this.gameNameFct(game),
                                url: this.gameUrlFct(game),
                            });
                        }
                    }
                    success({
                        games: freeGames,
                    });
                })
                .catch(error => {
                    Utils.log(`Error ${error.response.status} from ${this.humanSource} : ${JSON.stringify(error)}`);
                    success({
                        source: this.source,
                        error: `Cannot fetch games from ${this.humanSource} (see logs)`,
                    });
                });
        });
    }
}

module.exports.epicStore = new Store(
    'epic',
    'Epic Games Store',
    'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR',
    response => response.data.data.Catalog.searchStore.elements,
    game => game.price.totalPrice.discountPrice === 0,
    game => game.title,
    game => `https://www.epicgames.com/store/fr/product/${game.productSlug}`);

module.exports.humbleBundleStore = new Store(
    'humble',
    'Humble Bundle',
    'https://www.humblebundle.com/store/api/search?sort=discount&filter=all&hmb_source=store_navbar&request=1&page=0',
    response => response.data.results,
    game => game.current_price.amount === 0 && !game.human_name.endsWith(' Demo'),
    game => game.human_name,
    game => `https://www.humblebundle.com/store/${game.human_url}`);

module.exports.gogStore = new Store(
    'gog',
    'GOG',
    'https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&price=discounted&sort=popularity&hide=dlc',
    response => response.data.products,
    game => game.price.isFree && game.price.isDiscounted && !game.title.endsWith(' Demo'),
    game => game.title,
    game => `https://www.gog.com${game.url}`);
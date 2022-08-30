const dayjs = require("dayjs");
const Utils = require("./utils");
const axios = require("axios").default;

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
        return new Promise(async (success, reject) => {
            // http call
            let response;
            try {
                response = await axios.get(this.url)
            }catch(error){
                Utils.logError(`Error ${error.response?.status ?? '<unknown status>'} from ${this.humanSource}`, error);
                success({
                    source: this.source,
                    error: `Cannot fetch games from ${this.humanSource} (see logs)`,
                });
            }
            
            // free games detection algorithm
            try {
                const games = this.gamesFromResponseFct(response);
                const freeGames = [];
                for (const game of games) {
                    if (this.isFreeFct(game)) {
                        freeGames.push({
                            source: this.source,
                            name: this.gameNameFct(game),
                            url: this.gameUrlFct(game)
                        });
                    }
                }
                success({games: freeGames});
            } catch(error) {
                Utils.logError(`Error while checking free games from ${this.humanSource}`, error);
                success({
                    source: this.source,
                    error: `Error while checking free games from ${this.humanSource} (see logs)`,
                });
            }
        });
    }
}

module.exports.epicStore = new Store(
    "epic",
    "Epic Games Store",
    "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR",
    (response) => response.data.data.Catalog.searchStore.elements,
    (game) => {
        const currentDate = dayjs();
        if (!game.promotions || !Array.isArray(game.promotions.promotionalOffers)) {
            return false;
        }
        let allPromos = [];
        for (const promosArray of game.promotions.promotionalOffers) {
            if (Array.isArray(promosArray.promotionalOffers)) {
                allPromos = allPromos.concat(promosArray.promotionalOffers);
            }
        }
        let hasActivePromo = false;
        for (const promo of allPromos) {
            if (!promo.startDate || !promo.endDate) {
                continue;
            }
            const promoStart = dayjs(promo.startDate);
            const promoEnd = dayjs(promo.endDate);
            if (currentDate.isAfter(promoStart) && currentDate.isBefore(promoEnd)) {
                hasActivePromo = true;
                break;
            }
        }
        if (game.price && game.price.totalPrice) {
            const originalPrice = game.price.totalPrice.originalPrice | 0;
            const discountPrice = game.price.totalPrice.discount | 0;
            const isFree = originalPrice - discountPrice <= 0;
            return hasActivePromo && isFree;
        } else {
            return hasActivePromo;
        }
    },
    (game) => game.title,
    (game) => `https://www.epicgames.com/store/fr/product/${game.productSlug}`
);

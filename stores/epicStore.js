const dayjs = require('dayjs');
const Store = require('../store');

/**
 * @typedef {Object} DiscountSetting
 * @property {"PERCENTAGE"} discountType
 * @property {number} discountPercentage
 */


/**
 * @typedef {Object} Offer
 * @property {string} startDate UTC start date
 * @property {endDate} startDate UTC start date
 * @property {DiscountSetting} discountSetting
 */

/**
 * @typedef {Object} PromotionalOffers
 * @property {Offer[]} promotionalOffers
 */

/**
 * @typedef {Object} PromotionalOffersFirstLevel
 * @property {PromotionalOffers[]} promotionalOffers
 */

/**
 * @typedef {Object} Promotions
 * @property {PromotionalOffersFirstLevel[]} promotionalOffers
 */

/**
 * @typedef {Object} TotalPrice
 * @property {number} discountPrice
 * @property {number} originalPrice
 */

/**
 * @typedef {Object} Price
 * @property {TotalPrice} totalPrice
 */

/**
 * @typedef {Object} CatalogNsMappings
 * @property {string} pageSlug
 * @property {"productHome"} pageType
 */

/**
 * @typedef {Object} CatalogNs
 * @property {CatalogNsMappings[]} mappings
 */

/**
 * @typedef {Object} EpicGame
 * @property {string} title
 * @property {string} productSlug
 * @property {Price} price
 * @property {Promotions} promotions
 * @property {CatalogNs} catalogNs
 */

/**
 * @type {Store<EpicGame>}
 */
module.exports = new Store(
    'epic',
    'Epic Games Store',
    'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR',
    /** @returns {EpicGame[]} */
    (response) => response.data.data.Catalog.searchStore.elements,
    /** @param {EpicGame} game */
    (game) => {
        const currentDate = dayjs();
        if (!game.promotions || !Array.isArray(game.promotions.promotionalOffers)) {
            return false;
        }
        /** @type {Offer[]} */
        const allPromos = game.promotions.promotionalOffers?.map(outerPromos => outerPromos.promotionalOffers)?.flat() ?? [];
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
            const discountPrice = game.price.totalPrice.discountPrice | 0;
            return hasActivePromo && (discountPrice <= 0);
        }
        else {
            return hasActivePromo;
        }
    },
    /** @param {EpicGame} game */
    (game) => game.title,
    /** @param {EpicGame} game */ //game.catalogNs.mappings[0].pageSlug
    (game) => {
        const slug = game.catalogNs.mappings.find(mapping => mapping.pageType === 'productHome').pageSlug || game.productSlug;
        return `https://store.epicgames.com/fr/p/${slug}`;
    },
);

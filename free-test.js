const moment = require("moment-timezone");
const response = require("./free.json");
const responseElm = response.data.Catalog.searchStore.elements;

const hasActiveFreePromotion = (game) => {
    const currentDate = moment();
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
        const promoStart = moment(promo.startDate);
        const promoEnd = moment(promo.endDate);
        if (currentDate.isAfter(promoStart) && currentDate.isBefore(promoEnd)) {
            hasActivePromo = true;
            break;
        }
    }
    if (game.price && game.price.totalPrice) {
        const originalPrice = game.price.totalPrice.originalPrice | 0;
        const discountPrice = game.price.totalPrice.discountPrice | 0;
        const isFree = originalPrice - discountPrice <= 0;
        return hasActivePromo && isFree;
    } else {
        return hasActivePromo;
    }
};

for (const game of responseElm) {
    const isFree = hasActiveFreePromotion(game);
    console.info(`${game.title} is free ? ${isFree}`);
}

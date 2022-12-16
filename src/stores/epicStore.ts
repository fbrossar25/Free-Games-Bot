import dayjs from 'dayjs';
import {Store} from '../store';

type PromotionalOffer = {
    startDate: string,
    endDate: string,
    discountSetting: {
        discountPercentage: number,
        discountType: 'PERCENTAGE'
    }
}

type Promotions = {
    promotionalOffers: [{
        promotionalOffers: PromotionalOffer[]
    }]
}

type Price = {
    totalPrice: {
        discountPrice: number,
        originalPRice: number
    }
}

type CatalogNs = {
    mappings: {pageSlug: string, pageType: 'productHome'}[]
}

type EpicGame = {
    title: string,
    productSlug: string,
    price: Price,
    promotions: Promotions,
    catalogNs: CatalogNs
}

type EpicStoreResponseData = {
    data: {
        Catalog: {
            searchStore: {
                elements: EpicGame[]
            }
        }
    }
};

export const epicGameStore = new Store<EpicGame, EpicStoreResponseData>(
    'epic',
    'Epic Games Store',
    'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR',
    (response) => response.data.Catalog.searchStore.elements,
    (game) => {
        const currentDate = dayjs();
        if (!game.promotions || !Array.isArray(game.promotions.promotionalOffers)) {
            return false;
        }
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
        const slug = game.catalogNs.mappings.find(mapping => mapping.pageType === 'productHome')?.pageSlug || game.productSlug;
        return `https://store.epicgames.com/fr/p/${slug}`;
    },
);

export default epicGameStore;

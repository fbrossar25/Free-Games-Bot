import dayjs from "dayjs";
import { Store } from "../store";

export type PromotionalOffer = {
    startDate: string;
    endDate: string;
    discountSetting: {
        discountPercentage: number;
        discountType: "PERCENTAGE";
    };
};

export type Promotions = {
    promotionalOffers: {
        promotionalOffers: PromotionalOffer[];
    }[];
};

export type EpicGame = {
    title: string;
    urlSlug: string;
    productSlug: string;
    offerType: "BUNDLE" | "BASE_GAME";
    price: {
        totalPrice: {
            discountPrice: number;
            originalPRice: number;
        };
    };
    promotions: Promotions;
    catalogNs: {
        mappings: { pageSlug: string; pageType: "productHome" }[] | null;
    };
};

export type EpicStoreResponseData = {
    data: {
        Catalog: {
            searchStore: {
                elements: EpicGame[];
            };
        };
    };
};

export const epicGameStore = new Store<EpicGame, EpicStoreResponseData>(
    "epic",
    "Epic Games Store",
    "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR",
    (response: EpicStoreResponseData): EpicGame[] =>
        response.data.Catalog.searchStore.elements,
    (game) => {
        const currentDate = dayjs();
        if (
            !game.promotions ||
            !Array.isArray(game.promotions.promotionalOffers)
        ) {
            return false;
        }
        const allPromos =
            game.promotions.promotionalOffers
                ?.map((outerPromos) => outerPromos.promotionalOffers)
                ?.flat() ?? [];
        let hasActivePromo = false;
        for (const promo of allPromos) {
            if (!promo.startDate || !promo.endDate) {
                continue;
            }
            const promoStart = dayjs(promo.startDate);
            const promoEnd = dayjs(promo.endDate);
            if (
                currentDate.isAfter(promoStart) &&
                currentDate.isBefore(promoEnd)
            ) {
                hasActivePromo = true;
                break;
            }
        }
        if (game.price?.totalPrice) {
            const discountPrice = game.price.totalPrice.discountPrice | 0;
            return hasActivePromo && discountPrice <= 0;
        } else {
            return hasActivePromo;
        }
    },
    (game) => game.title,
    (game) => {
        const slug =
            game.catalogNs.mappings?.find(
                (mapping) => mapping.pageType === "productHome"
            )?.pageSlug ??
            game.urlSlug ??
            game.productSlug;
        const typeSlug = game.offerType === "BUNDLE" ? "bundles" : "p";
        return `https://store.epicgames.com/fr/${typeSlug}/${slug}`;
    }
);

export default epicGameStore;

import {Store} from "../store";
import {JSDOM} from "jsdom";
import {toHeaderCase} from "js-convert-case";

export type GogGame = {
    url: string,
    title: string
}
export const gog = new Store<GogGame, string>(
    'gog',
    'GOG',
    'https://www.gog.com/fr',
    (response) => {
        // TODO parse html string to check for a banner
        const dom = new JSDOM(response);
        const banner = dom.window.document.querySelector('#giveaway');
        if(!banner) return [];
        const hrefAttributes = banner.getAttributeNames().filter(name => name.includes('href'))
            .map(name => banner.getAttribute(name))
            .filter(href => href?.startsWith('/'));
        if(!Array.isArray(hrefAttributes) || hrefAttributes.length < 1) return [];
        const url = `https://www.gog.com${hrefAttributes[0]}`;
        // get last part of url
        const title = toHeaderCase(url?.split('/').pop());
        return [{url, title: title ?? url}];
    },
    () => true, // always true because we check for a giveaway banner
    (game) => game.title,
    (game) => game.url
);
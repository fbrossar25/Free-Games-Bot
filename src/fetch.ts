import {
    EmbedBuilder,
    type APIEmbedField,
    type ColorResolvable,
} from "discord.js";
import { addGameIdsToDb } from "./db.ts";
import { FetchError, FetchResult, itad, type FreeGames } from "./store.ts";
import * as Utils from "./utils.ts";

const gamesAvailableColor: ColorResolvable = "#57F287";
const noGamesAvailableColor: ColorResolvable = "#FEE75C";
const errorColor: ColorResolvable = "#ED4245";

function extractGamesAndErrors(fetchResults: Array<FetchResult | FetchError>): {
    games: FreeGames;
    errors: FetchError[];
} {
    return fetchResults.reduce<{ games: FreeGames; errors: FetchError[] }>(
        (acc, res) => {
            if ("error" in res) {
                acc.errors.push(res);
            } else {
                for (const game of res.games) {
                    acc.games.push(game);
                }
            }
            return acc;
        },
        { games: [], errors: [] }
    );
}

/**
 * @returns The EmbedBuilder first, then the number of giveaways total, or -1 if it is a error message.
 */
function generateMessageAndSaveNotifications(
    fetchResults: FetchResult | FetchError,
    includeAlreadyNotified: boolean
): [EmbedBuilder, number] {
    const { games, errors } = extractGamesAndErrors([fetchResults]);

    if (!includeAlreadyNotified) addGameIdsToDb(games.map((g) => g.id));

    if (games.length === 0 && errors.length === 0) {
        return [
            new EmbedBuilder()
                .setColor(noGamesAvailableColor)
                .setTitle("🎮 Free games bot 🎮")
                .setDescription("🙁 No free games available 🙁")
                .setTimestamp(),
            0,
        ];
    } else if (games.length === 0 && errors.length > 0) {
        return [
            new EmbedBuilder()
                .setColor(errorColor)
                .setTitle("🎮 Free games bot 🎮")
                .setDescription("💥 Error fetching games, check bot's logs 💥")
                .setTimestamp(),
            -1,
        ];
    }
    const embed = new EmbedBuilder()
        .setColor(gamesAvailableColor)
        .setTitle("🎮 Free games bot 🎮")
        .setDescription("🎉 Free games available 🎉")
        .setTimestamp();
    const embedFields: APIEmbedField[] = games.map((game) => {
        const expiryTimestamp = Math.floor(
            new Date(game.expiry).getTime() / 1000
        );
        return {
            name: game.name,
            value: `[🎁 Redeem game (${game.shop}) 🎁](${game.url})\n⏳ Expires : <t:${expiryTimestamp}:F> (<t:${expiryTimestamp}:R>)`,
            inline: false,
        };
    });
    if (errors.length > 0) {
        embed.setColor(noGamesAvailableColor);
        embedFields.push({
            name: "errors",
            value: "💥 Some errors happened during this command, check bot's logs 💥",
            inline: false,
        });
    }
    embed.addFields(embedFields);

    return [embed, games.length];
}

/**
 * Fetch free games from all sources and returns the message to send in discord
 * @returns The EmbedBuilder first, then the number of giveaways total, or -1 if it is a error message.
 */
export async function fetchAll(
    includeAlreadyNotified = false
): Promise<[EmbedBuilder, number]> {
    try {
        return generateMessageAndSaveNotifications(
            await itad.fetch(includeAlreadyNotified),
            includeAlreadyNotified
        );
    } catch (error) {
        Utils.logError("Error while fetching games", error);
        return [
            new EmbedBuilder()
                .setColor(errorColor)
                .setTitle("🎮 Free games bot 🎮")
                .setDescription("💥 Error fetching games 💥")
                .setDescription("See bot's server logs for details")
                .setTimestamp(),
            -1,
        ];
    }
}

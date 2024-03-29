import epicStore from "../src/stores/epicStore";

describe("Test epicStore", () => {
    test("To have a response with games", async () => {
        const response = await epicStore.callUrl();
        expect(response).toBeTruthy();
        const games = epicStore.gamesFromResponseFct(response.data);
        expect(games).toBeInstanceOf(Array);
        expect(games.length).toBeGreaterThanOrEqual(1);
    });

    test("At least one free game", async () => {
        const freeGames = await epicStore.fetch();
        expect(freeGames).toHaveProperty("games");
        if ("games" in freeGames) {
            expect(freeGames.games).toBeInstanceOf(Array);
            expect(freeGames.games.length).toBeGreaterThanOrEqual(1);
        } else {
            fail("freeGames not instanceof FetchResult");
        }
    });

    test("Every free games is valid", async () => {
        const freeGames = await epicStore.fetch();
        expect(freeGames).toHaveProperty("games");
        if ("games" in freeGames) {
            for (const freeGame of freeGames.games) {
                expect(freeGame).toHaveProperty("url");
                expect(freeGame).toHaveProperty("source");
                expect(freeGame).toHaveProperty("name");
                // is a url
                expect(freeGame.url).toMatch(/^https:\/\/.+$/i);
                // not ending with null
                expect(freeGame.url).not.toMatch(/.+\/null$/i);
            }
        } else {
            fail("freeGames not instanceof FetchResult");
        }
    });
});

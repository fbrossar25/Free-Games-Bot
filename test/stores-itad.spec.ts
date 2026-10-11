import itadStore from "../src/stores/isThereAnyDeals";
import fs from "fs";
import path from "path";

// Mock the callUrl method to return our test XML
const mockXmlContent = fs.readFileSync(path.join(__dirname, "todays-feed.xml"), "utf-8");

describe("Test itadStore", () => {
    test("To have a response with games", async () => {
        // Mock the callUrl to return our test XML
        const originalCallUrl = itadStore.callUrl;
        itadStore.callUrl = async () => {
            return {
                data: mockXmlContent
            } as any;
        };

        try {
            const response = await itadStore.callUrl();
            expect(response).toBeTruthy();
            const games = itadStore.gamesFromResponseFct(mockXmlContent);
            expect(games).toBeInstanceOf(Array);
            expect(games.length).toBeGreaterThanOrEqual(1);
        } finally {
            // Restore original method
            itadStore.callUrl = originalCallUrl;
        }
    });

    test("At least one free game", async () => {
        // Mock the callUrl to return our test XML
        const originalCallUrl = itadStore.callUrl;
        itadStore.callUrl = async () => {
            return {
                data: mockXmlContent
            } as any;
        };

        try {
            const freeGames = await itadStore.fetch();
            expect(freeGames).toHaveProperty("games");
            if ("games" in freeGames) {
                expect(freeGames.games).toBeInstanceOf(Array);
                expect(freeGames.games.length).toBeGreaterThanOrEqual(1);
            } else {
                fail("freeGames not instanceof FetchResult");
            }
        } finally {
            // Restore original method
            itadStore.callUrl = originalCallUrl;
        }
    });

    test("Every free game is valid", async () => {
        // Mock the callUrl to return our test XML
        const originalCallUrl = itadStore.callUrl;
        itadStore.callUrl = async () => {
            return {
                data: mockXmlContent
            } as any;
        };

        try {
            const freeGames = await itadStore.fetch();
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
        } finally {
            // Restore original method
            itadStore.callUrl = originalCallUrl;
        }
    });

    test("Empty feed returns empty list", async () => {
        // Mock empty RSS feed
        const emptyXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Empty feed</title>
        <link>https://isthereanydeal.com</link>
        <description>Empty giveaway feed</description>
        <lastBuildDate>Sun, 11 Oct 2026 17:14:03 +0200</lastBuildDate>
        <language>en</language>
        <ttl>60</ttl>
    </channel>
</rss>`;

        // Mock the callUrl to return our test XML
        const originalCallUrl = itadStore.callUrl;
        itadStore.callUrl = async () => {
            return {
                data: emptyXml
            } as any;
        };

        try {
            const freeGames = await itadStore.fetch();
            expect(freeGames).toHaveProperty("games");
            if ("games" in freeGames) {
                expect(freeGames.games).toBeInstanceOf(Array);
                expect(freeGames.games.length).toBe(0);
            } else {
                fail("freeGames not instanceof FetchResult");
            }
        } finally {
            // Restore original method
            itadStore.callUrl = originalCallUrl;
        }
    });

    test("Error response returns empty list", async () => {
        // Mock error response (HTML 500 error)
        const errorHtml = `<html><body><h1>500 Internal Server Error</h1></body></html>`;

        // Mock the callUrl to return our test XML
        const originalCallUrl = itadStore.callUrl;
        itadStore.callUrl = async () => {
            return {
                data: errorHtml
            } as any;
        };

        try {
            const freeGames = await itadStore.fetch();
            expect(freeGames).toHaveProperty("games");
            if ("games" in freeGames) {
                expect(freeGames.games).toBeInstanceOf(Array);
                expect(freeGames.games.length).toBe(0);
            } else {
                fail("freeGames not instanceof FetchResult");
            }
        } finally {
            // Restore original method
            itadStore.callUrl = originalCallUrl;
        }
    });
});

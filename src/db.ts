import * as Utils from "./utils.ts";
import * as fs from "fs";
import * as process from "process";

// loading config
const configDir = process.env.CONF_DIR ?? `${process.cwd() ?? ""}/conf`;
const dbPath = `${configDir}/free-games-bot.db.json`;

/** Just stores game ids to dedup notifications from day to day */
type DBContent = number[];

function isValidContent(content: unknown): content is DBContent {
    return (
        Array.isArray(content) &&
        (content.length === 0 || content.every((id) => typeof id === "number"))
    );
}

Utils.log(`Using config dir ${configDir}`);
if (!fs.existsSync(configDir)) {
    throw new Error(`Config dir ${configDir} does not exists.`);
}

let _db: { alreadyNotifiedGameIds: Set<number> };
let dbInit = false;

function readDb() {
    Utils.log(`Reading ${dbPath}`);
    if (!fs.existsSync(dbPath)) {
        _db = { alreadyNotifiedGameIds: new Set<number>() };
        return;
    }
    const content = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    if (isValidContent(content)) {
        _db = { alreadyNotifiedGameIds: new Set<number>(content) };
        return;
    }
    throw new Error(`Invalid DB content, check ${dbPath} or remove it.`);
}

function writeDb() {
    Utils.log(`Writing ${dbPath}`);
    fs.writeFileSync(dbPath, JSON.stringify([..._db.alreadyNotifiedGameIds]), {
        encoding: "utf-8",
    });
}

if (!dbInit) readDb();

export function getGameIdsFromDb(): Set<number> {
    return _db?.alreadyNotifiedGameIds ?? new Set<number>();
}

export function addGameIdsToDb(ids: number[]) {
    for (const id of ids) _db.alreadyNotifiedGameIds.add(id);
    writeDb();
}

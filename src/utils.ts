import * as dayjs from 'dayjs';

export function getTimeZone(): string {
    return process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getCallerInfoString(): string {
    try {
        throw Error('');
    }
    catch (err) {
        const caller_line = err.stack.split('\n')[3];
        const index = caller_line.indexOf('at ');
        const clean = caller_line.slice(index + 2, caller_line.length).trim();
        return clean;
    }
}

export function getDateString(date: Date = new Date(), showMillis: boolean = false): string {
    return dayjs(date).format(`YYYY-MM-DD HH:mm:ss${showMillis ? '.SSS' : ''}`);
}

export function log(msg: string) {
    console.log(`${getDateString(new Date(), true)} : ${getCallerInfoString()} - ${msg}`);
}

export function logError(msg: string, error: Error) {
    console.error(`${getDateString(new Date(), true)} : ${getCallerInfoString()} - ${msg}`, error);
}
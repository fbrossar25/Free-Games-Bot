import dayjs from 'dayjs';

export function getTimeZone(): string {
    return process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getCallerInfoString(): string {
    try {
        throw Error('');
    }
    catch (err) {
        const e = err as Error;
        if(e?.stack) {
            const callers = e.stack.split('\n')
            if(Array.isArray(callers) && callers.length > 3) {
                const caller_line = e.stack.split('\n')[3];
                const index = caller_line.indexOf('at ');
                return caller_line.slice(index + 2, caller_line.length).trim();
            }
        }
        return '';
    }
}

export function getDateString(date: Date = new Date(), showMillis = false): string {
    if(!date) return '<error: missing date>';
    return dayjs(date).format(`YYYY-MM-DD HH:mm:ss${showMillis ? '.SSS' : ''}`);
}

export function log(msg: string) {
    console.log(`${getDateString(new Date(), true)} : ${getCallerInfoString()} - ${msg}`);
}

export function logError(msg: string, error: unknown) {
    console.error(`${getDateString(new Date(), true)} : ${getCallerInfoString()} - ${msg}`, error);
}
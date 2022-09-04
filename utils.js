const dayjs = require('dayjs');

function getTimeZone() {
    return process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getCallerInfoString() {
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

function getDateString(date = new Date(), showMillis = false) {
    // return dateFormatter.format(date ?? new Date());
    return dayjs(date).format(`YYYY-MM-DD HH:mm:ss${showMillis ? '.SSS' : ''}`);
}

/**
 * @param {string} msg
 */
module.exports.log = (msg) => {
    console.log(`${getDateString(new Date(), true)} : ${getCallerInfoString()} - ${msg}`);
};

/**
 * @param {string} msg
 * @param {any} error
 */
module.exports.logError = (msg, error) => {
    console.error(`${getDateString(new Date(), true)} : ${getCallerInfoString()} - ${msg}`, error);
};
module.exports.getDateString = getDateString;
/** @returns {string} timezone name */
module.exports.getTimeZone = getTimeZone;
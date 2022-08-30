const dayjs = require('dayjs');

function getTimeZone() {
    return process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const dateFormatter = new Intl.DateTimeFormat('fr-fr', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
});

function getCallerInfoString() {
    try {
        throw Error('');
    }
    catch(err) {
        const caller_line = err.stack.split('\n')[3];
        const index = caller_line.indexOf('at ');
        const clean = caller_line.slice(index + 2, caller_line.length).trim();
        return clean;
    }
}

function getDateString(date=new Date(), showMillis=false) {
    //return dateFormatter.format(date ?? new Date());
    return dayjs(date).format(`YYYY-MM-DD HH:mm:ss${showMillis ? '.SSS' : ''}`);
}

module.exports.log = (msg) => {
    console.log(`${getDateString(new Date(), true)} : ${getCallerInfoString()} - ${msg}`);
};
module.exports.logError = (msg, error) => {
    console.error(`${getDateString(new Date(), true)} : ${getCallerInfoString()} - ${msg}`, error);
};

module.exports.getDateString = getDateString;
module.exports.getTimeZone = getTimeZone;
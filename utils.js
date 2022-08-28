const moment = require('moment');

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

module.exports.log = (msg) => {
    console.log(`${getDateString()}:${getCallerInfoString()} - ${msg}`);
};

function getDateString(date, utcOffset, showUtc = false) {
    let m;
    if(date instanceof Date) {
        m = moment(date);
    }
    else {
        m = moment();
    }
    if(typeof utcOffset === 'number') {
        m.utc().utcOffset(utcOffset);
    }

    if(showUtc) {
        return m.format('DD/MM/YYYY @ HH:mm:ss Z');
    }

    return m.format('DD/MM/YYYY @ HH:mm:ss');
}

module.exports.getDateString = getDateString;
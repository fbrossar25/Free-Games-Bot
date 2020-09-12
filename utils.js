const moment = require('moment');

module.exports.log = (msg) => {
    console.log(`${getDateString()} - ${msg}`);
};

function getDateString(date = new Date()) {
    return moment(date).format('DD/MM/YYYY @ HH:mm:ss');
}

module.exports.getDateString = getDateString;
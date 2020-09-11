const dateOptions = { month: 'numeric', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };

module.exports.log = (msg) => {
    console.log(`${getDateString()} - ${msg}`);
};

function getDateString(date = new Date()) {
    return date.toLocaleDateString('en-EN', dateOptions);
}

module.exports.getDateString = getDateString;
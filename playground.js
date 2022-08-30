require('dotenv').config();
const Utils = require('./utils');
const d = new Date();

console.log(`Without TZ : ${Utils.getDateString(d)}`);

console.log(`TZ offset : ${d.getTimezoneOffset()}`);
console.log(`string: ${d.toString()}`);
console.log(`UTC string : ${d.toUTCString()}`);
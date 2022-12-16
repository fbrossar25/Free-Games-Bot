const Utils = require('./utils');
const { config } = require('./config');
const { RecurrenceRule } = require('node-schedule');

/** D:HH:MM format with optional leading 0 for hours */
const ruleRegexp = /^[0-6]:(?:0?\d|1\d|2[0-3]):[0-5][0-9]$/;

/**
 * Class wrapping a simple rule to run a job once a week
 */
class SimpleRule {
    /**
     * Basic day, hour, minute constructor
     * @param {!number} dayOfWeek integer from 0 to 6, 0 being Sunday
     * @param {!number} hour integer from 0 to 23
     * @param {!number} minute integer from 0 to 59
     * @throws throw an error if one of the parameters is out of bounds
     */
    constructor(dayOfWeek, hour, minute) {
        this.dayOfWeek = dayOfWeek;
        this.hour = hour;
        this.minute = minute;
        if (!this.checkValidity()) {
            throw Error(`Invalid rule : ${this.dayOfWeek}:${this.hour}:${this.minute}`);
        }
    }

    /**
     * Returns true if the rule is valid, checking whether each members are in bounds
     * @returns true or false
     */
    checkValidity() {
        const dayOfWeekIsValid = this.dayOfWeek >= 0 && this.dayOfWeek <= 6;
        const hourIsValid = this.hour >= 0 && this.hour <= 23;
        const minuteIsValid = this.minute >= 0 && this.minute <= 59;
        return dayOfWeekIsValid && hourIsValid && minuteIsValid;
    }

    /**
     * Returns a corresponding new instance of RecurrenceRule
     * @returns {RecurrenceRule}
     */
    toRecurrenceRule() {
        const rule = new RecurrenceRule();
        rule.dayOfWeek = this.dayOfWeek;
        rule.hour = this.hour;
        rule.minute = this.minute;
        rule.tz = Utils.getTimeZone();
        return rule;
    }
}

/**
 * Check whether the given string is a simple rule in the D:HH:MM format or not
 * @param {?string} rule the rule to check
 */
function isValidRule(rule) {
    return ruleRegexp.test(rule.trim());
}

/**
 * Check if the given rule is valid and returns a SimpleRule instance
 * @param {?string} rule the rule to parse (D:HH:MM format)
 * @param {null|SimpleRule} [defaultRule=null] the default rule to return if rule is not a valid string
 */
function parseRule(rule, defaultRule = null) {
    if (!isValidRule(rule)) {
        Utils.log(`${config.weeklyAnnounce} is not a valid rule, must be in D:HH:MM, where D is day of week beetween 0 (Sunday) and 6, HH is hour of day, MM minute of hour`);
        return defaultRule;
    }
    const ruleParts = rule.trim().split(':');
    return new SimpleRule(parseInt(ruleParts[0]), parseInt(ruleParts[1]), parseInt(ruleParts[2]));
}

module.exports.SimpleRule = SimpleRule;
module.exports.isValidRule = isValidRule;
module.exports.parseRule = parseRule;
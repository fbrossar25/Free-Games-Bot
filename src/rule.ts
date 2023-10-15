import * as Utils from './utils';
import config from './config';
import { RecurrenceRule } from 'node-schedule';

/** D:HH:MM format with optional leading 0 for hours */
const ruleRegexp = /^[0-6]:(?:0?\d|1\d|2[0-3]):[0-5]\d$/;

/**
 * Class wrapping a simple rule to run a job once a week
 */
export class SimpleRule {
    /** Day of the week: 0-6 (0 = Sunday)*/
    public dayOfWeek: number;
    /** Hour of day : 0-23 */
    public hour: number;
    /** Minute of hour : 0-59 */
    public minute: number;

    /**
     * Basic day, hour, minute constructor
     * @param dayOfWeek integer from 0 to 6, 0 being Sunday
     * @param hour integer from 0 to 23
     * @param minute integer from 0 to 59
     * @throws throw an error if one of the parameters is out of bounds
     */
    constructor(dayOfWeek: number, hour: number, minute: number) {
        this.dayOfWeek = dayOfWeek;
        this.hour = hour;
        this.minute = minute;
        if (!this.checkValidity()) {
            throw Error(`Invalid rule : ${this.dayOfWeek}:${this.hour}:${this.minute}`);
        }
    }

    /**
     * Returns true if the rule is valid, checking whether each members are in bounds
     */
    checkValidity(): boolean {
        const dayOfWeekIsValid = this.dayOfWeek >= 0 && this.dayOfWeek <= 6;
        const hourIsValid = this.hour >= 0 && this.hour <= 23;
        const minuteIsValid = this.minute >= 0 && this.minute <= 59;
        return dayOfWeekIsValid && hourIsValid && minuteIsValid;
    }

    /**
     * Returns a corresponding new instance of RecurrenceRule
     */
    toRecurrenceRule(): RecurrenceRule {
        const rule = new RecurrenceRule();
        rule.dayOfWeek = this.dayOfWeek;
        rule.hour = this.hour;
        rule.minute = this.minute;
        rule.tz = Utils.getTimeZone();
        return rule;
    }

    static isSimpleRuleInstance(rule: null|object): boolean {
        if(!rule) return false;
        // must contain all these properties
        return['dayOfWeek', 'hour', 'minute', 'checkValidity', 'toRecurrenceRule']
            .findIndex((prop) => !(prop in rule)) < 0;
    }
}

/**
 * Check whether the given string is a simple rule in the D:HH:MM format or not
 * @param rule the rule to check
 */
export function isValidRule(rule: string): boolean {
    return ruleRegexp.test(rule.trim());
}

export const hardcodedDefaultRule = new SimpleRule(4, 18, 30);

/**
 * Check if the given rule is valid and returns a SimpleRule instance
 * @param rule the rule to parse (D:HH:MM format)
 * @param defaultRule default rule to return if rule is not a valid string
 */
export function parseRule(rule: string, defaultRule: SimpleRule = hardcodedDefaultRule): SimpleRule {
    if (!isValidRule(rule)) {
        Utils.log(`${config.weeklyAnnounce} is not a valid rule, must be in D:HH:MM, where D is day of week between 0 (Sunday) and 6, HH is hour of day, MM minute of hour`);
        return defaultRule;
    }
    const ruleParts = rule.trim().split(':');
    return new SimpleRule(parseInt(ruleParts[0]), parseInt(ruleParts[1]), parseInt(ruleParts[2]));
}

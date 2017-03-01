"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require('moment');
// Ensure that moment treats invalid date as truly invalid date
// without the annoying deprecation warning.
moment.createFromInputFallback = config => {
    config._d = new Date(NaN);
};
class Type {
    /**
     * Boolean entry type.
     *
     * @param {null|boolean|function} defaultValue
     * @return {Type}
     */
    static boolean(defaultValue = null) {
        return new Type('boolean', defaultValue);
    }
    /**
     * String entry type.
     *
     * @param {null|string|function} defaultValue
     * @return {Type}
     */
    static string(defaultValue = null) {
        return new Type('string', defaultValue);
    }
    /**
     * Integer entry type.
     *
     * @param {null|number|function} defaultValue
     * @return {Type}
     */
    static integer(defaultValue = null) {
        return new Type('integer', defaultValue);
    }
    /**
     * Number entry type.
     *
     * @param {null|number|function} defaultValue
     * @return {Type}
     */
    static number(defaultValue = null) {
        return new Type('number', defaultValue);
    }
    /**
     * Date entry type.
     *
     * @param {null|number|string|Moment|function} defaultValue
     * @return {Type}
     */
    static date(defaultValue = null) {
        return new Type('date', defaultValue);
    }
    /**
     * Array entry type.
     *
     * @param {Array} defaultValue
     * @return {Type}
     */
    static array(defaultValue = []) {
        return new Type('array', defaultValue);
    }
    /**
     * Reference entry type.
     *
     * @param {Model} model
     * @return {Type}
     */
    static reference(model) {
        return new Type('reference', {
            $type: 'reference',
            docType: model.name,
            docId: null
        });
    }
    /**
     * Type constructor.
     *
     * @param {string} type
     * @param {null|boolean|number|string|Moment|function} defaultValue
     */
    constructor(type, defaultValue) {
        this.type = type;
        this.defaultValue = defaultValue;
        this.guardAgainstInvalidValue(this.getDefaultValue());
    }
    /**
     * Provides the type of the entry.
     *
     * @return {string}
     */
    getType() {
        return this.type;
    }
    /**
     * Provides the default value for the type.
     *
     * @return {null|boolean|number|string|Moment|function}
     */
    getDefaultValue() {
        let value = this.defaultValue;
        if (typeof value === 'function') {
            value = this.defaultValue();
        }
        if (this.type === 'date') {
            value = this.convertDateToMoment(value);
        }
        return value;
    }
    /**
     * Checks the provided value for the type.
     *
     * @param {any} value
     * @return {boolean}
     */
    check(value) {
        if (this.type === 'date') {
            value = this.convertDateToMoment(value);
        }
        return this.guardAgainstInvalidValue(value);
    }
    /**
     * Tries to convert the entry value to the moment date format.
     *
     * @param {null|boolean|number|string|Moment} value
     * @return {null|Moment}
     */
    convertDateToMoment(value) {
        switch (typeof value) {
            case 'number':
            case 'string':
            case 'boolean':
                value = moment(value);
            default:
                break;
        }
        return value;
    }
    /**
     * Checks if entry value is valid.
     */
    guardAgainstInvalidValue(value) {
        if (value !== null) {
            switch (this.type) {
                case 'date':
                    value = this.convertDateToMoment(value);
                    if (!value.isValid()) {
                        throw new TypeError(`Invalid 'date' format.`);
                    }
                    break;
                case 'integer':
                    if (!Number.isInteger(value)) {
                        throw new TypeError(`Invalid 'integer' format.`);
                    }
                    break;
                case 'reference':
                    /* istanbul ignore if */
                    if (!(value.hasOwnProperty('$type')
                        && value.hasOwnProperty('docId')
                        && value.hasOwnProperty('docType'))) {
                        throw new TypeError(`Invalid 'reference' format.`);
                    }
                    break;
                case 'array':
                    if (!Array.isArray(value)) {
                        throw new TypeError(`Invalid 'array' format.`);
                    }
                    break;
                default:
                    if (typeof value !== this.type) {
                        throw new TypeError(`Invalid '${this.type}' format.`);
                    }
                    break;
            }
        }
        return true;
    }
}
exports.default = Type;

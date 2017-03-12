"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require('moment');
const OriginalJoi = require('joi');
const instance_1 = require("../entities/instance");
const setteeError_1 = require("../errors/setteeError");
// Ensure that moment treats invalid date as truly invalid date
// without the annoying deprecation warning.
/* istanbul ignore next */
moment.createFromInputFallback = config => {
    config._d = new Date(NaN);
};
class Validator {
    /**
     * Checks the provided object schema.
     *
     * @param {any} layout
     * @return {boolean}
     */
    checkSchema(layout) {
        if (layout.hasOwnProperty('isJoi')) {
            return layout.isJoi;
        }
        throw new setteeError_1.default('Schema is not valid.');
    }
    /**
     * Checks data agains the provided schema.
     *
     * @param {Object} data
     * @param {ObjectSchema} layout
     * @return {boolean}
     */
    checkAgainstSchema(data, layout) {
        this.checkSchema(layout);
        const result = exports.Joi.validate(data, layout);
        if (result.error) {
            let originalMessage = result.error.details[0].message;
            throw new TypeError(`Field ${originalMessage.replace(/"/g, '\'')}.`);
        }
        return result.value;
    }
}
exports.default = Validator;
exports.Joi = OriginalJoi.extend([
    {
        base: OriginalJoi.any(),
        name: 'momentdate',
        language: {
            valid: 'must be a valid momentjs instance'
        },
        rules: [
            {
                name: 'valid',
                validate(params, value, state, options) {
                    if (!moment.isMoment(value)) {
                        value = moment.utc(value);
                    }
                    if (!value.isValid()) {
                        return this.createError('momentdate.valid', { v: value, q: params.q }, state, options);
                    }
                    return value;
                }
            }
        ]
    },
    {
        base: OriginalJoi.any(),
        name: 'reference',
        language: {
            valid: 'must be a valid model instance'
        },
        rules: [
            {
                name: 'valid',
                validate(params, value, state, options) {
                    if (value instanceof instance_1.default) {
                        return value;
                    }
                    return this.createError('reference.valid', { v: value, q: params.q }, state, options);
                }
            }
        ]
    }
]);

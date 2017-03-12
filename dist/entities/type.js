"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("../services/validator");
const instance_1 = require("./instance");
class Type {
    /**
     * Boolean entry type.
     *
     * @param {null|boolean|function} defaultValue
     * @param {string} Optional callbackName
     * @return {BooleanSchema}
     */
    static boolean(defaultValue = null, callbackName) {
        return validator_1.Joi.boolean().allow(null)
            .default(defaultValue, callbackName);
    }
    /**
     * String entry type.
     *
     * @param {null|string|function} defaultValue
     * @param {string} Optional callbackName
     * @return {StringSchema}
     */
    static string(defaultValue = null, callbackName) {
        return validator_1.Joi.string().allow(null)
            .default(defaultValue, callbackName);
    }
    /**
     * Integer entry type.
     *
     * @param {null|number|function} defaultValue
     * @param {string} Optional callbackName
     * @return {NumberSchema}
     */
    static integer(defaultValue = null, callbackName) {
        return validator_1.Joi.number().integer().allow(null)
            .default(defaultValue, callbackName);
    }
    /**
     * Number entry type.
     *
     * @param {null|number|function} defaultValue
     * @param {string} Optional callbackName
     * @return {NumberSchema}
     */
    static number(defaultValue = null, callbackName) {
        return validator_1.Joi.number().allow(null)
            .default(defaultValue, callbackName);
    }
    /**
     * Date entry type.
     *
     * @param {null|number|string|Moment|function} defaultValue
     * @param {string} Optional callbackName
     * @return {DateSchema}
     */
    static date(defaultValue = null, callbackName) {
        return validator_1.Joi.momentdate().valid().allow(null)
            .default(defaultValue, callbackName);
    }
    /**
     * Object entry type.
     *
     * @param {Object} schema
     * @param {Object|Function} defaultValue
     * @param {string} Optional callbackName
     * @return {ObjectSchema}
     */
    static object(schema, defaultValue = null, callbackName) {
        return validator_1.Joi.object().keys(schema).allow(null)
            .default(defaultValue, callbackName);
    }
    /**
     * Array entry type.
     *
     * @param {Type} itemType
     * @param {Array} defaultValue
     * @param {string} Optional callbackName
     * @return {Type}
     */
    static array(itemType, defaultValue = [], callbackName) {
        return validator_1.Joi.array().items(itemType)
            .default(defaultValue, callbackName);
    }
    /**
     * Reference entry type.
     *
     * @param {Model} model
     * @return {Type}
     */
    static reference(model) {
        return validator_1.Joi.reference().valid()
            .default(new instance_1.default(null, {
            $type: 'reference',
            docId: null,
            docType: model.name
        }, null, model));
    }
}
exports.default = Type;

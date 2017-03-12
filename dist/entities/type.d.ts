import { BooleanSchema, StringSchema, NumberSchema, DateSchema, ObjectSchema, Schema, ArraySchema } from '@types/joi';
import Model from './model';
export default class Type {
    /**
     * Boolean entry type.
     *
     * @param {null|boolean|function} defaultValue
     * @param {string} Optional callbackName
     * @return {BooleanSchema}
     */
    static boolean(defaultValue?: any, callbackName?: string): BooleanSchema;
    /**
     * String entry type.
     *
     * @param {null|string|function} defaultValue
     * @param {string} Optional callbackName
     * @return {StringSchema}
     */
    static string(defaultValue?: any, callbackName?: string): StringSchema;
    /**
     * Integer entry type.
     *
     * @param {null|number|function} defaultValue
     * @param {string} Optional callbackName
     * @return {NumberSchema}
     */
    static integer(defaultValue?: any, callbackName?: string): NumberSchema;
    /**
     * Number entry type.
     *
     * @param {null|number|function} defaultValue
     * @param {string} Optional callbackName
     * @return {NumberSchema}
     */
    static number(defaultValue?: any, callbackName?: string): NumberSchema;
    /**
     * Date entry type.
     *
     * @param {null|number|string|Moment|function} defaultValue
     * @param {string} Optional callbackName
     * @return {DateSchema}
     */
    static date(defaultValue?: any, callbackName?: string): DateSchema;
    /**
     * Object entry type.
     *
     * @param {Object} schema
     * @param {Object|Function} defaultValue
     * @param {string} Optional callbackName
     * @return {ObjectSchema}
     */
    static object(schema: any, defaultValue?: any, callbackName?: string): ObjectSchema;
    /**
     * Array entry type.
     *
     * @param {Type} itemType
     * @param {Array} defaultValue
     * @param {string} Optional callbackName
     * @return {Type}
     */
    static array(itemType: Schema, defaultValue?: any[], callbackName?: string): ArraySchema;
    /**
     * Reference entry type.
     *
     * @param {Model} model
     * @return {Type}
     */
    static reference(model: Model): Type;
}

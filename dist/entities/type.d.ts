import { Moment } from 'moment';
import Model from './model';
export default class Type {
    /**
     * Boolean entry type.
     *
     * @param {null|boolean|function} defaultValue
     * @return {Type}
     */
    static boolean(defaultValue?: any): Type;
    /**
     * String entry type.
     *
     * @param {null|string|function} defaultValue
     * @return {Type}
     */
    static string(defaultValue?: any): Type;
    /**
     * Integer entry type.
     *
     * @param {null|number|function} defaultValue
     * @return {Type}
     */
    static integer(defaultValue?: any): Type;
    /**
     * Number entry type.
     *
     * @param {null|number|function} defaultValue
     * @return {Type}
     */
    static number(defaultValue?: any): Type;
    /**
     * Date entry type.
     *
     * @param {null|number|string|Moment|function} defaultValue
     * @return {Type}
     */
    static date(defaultValue?: any): Type;
    /**
     * Array entry type.
     *
     * @param {Array} defaultValue
     * @return {Type}
     */
    static array(defaultValue?: any[]): Type;
    /**
     * Reference entry type.
     *
     * @param {Model} model
     * @return {Type}
     */
    static reference(model: Model): Type;
    /**
     * Type of the entry.
     *
     * {string}
     */
    protected type: string;
    /**
     * Default value of the entry.
     *
     * {null|boolean|number|string|Moment|function}
     */
    protected defaultValue: any;
    /**
     * Type constructor.
     *
     * @param {string} type
     * @param {null|boolean|number|string|Moment|function} defaultValue
     */
    constructor(type: string, defaultValue: any);
    /**
     * Provides the type of the entry.
     *
     * @return {string}
     */
    getType(): string;
    /**
     * Provides the default value for the type.
     *
     * @return {null|boolean|number|string|Moment|function}
     */
    getDefaultValue(): any;
    /**
     * Checks the provided value for the type.
     *
     * @param {any} value
     * @return {boolean}
     */
    check(value: any): boolean;
    /**
     * Tries to convert the entry value to the moment date format.
     *
     * @param {null|boolean|number|string|Moment} value
     * @return {null|Moment}
     */
    protected convertDateToMoment(value: any): null | Moment;
    /**
     * Checks if entry value is valid.
     */
    protected guardAgainstInvalidValue(value: any): boolean;
}

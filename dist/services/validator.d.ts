import { ObjectSchema } from 'joi';
export default class Validator {
    /**
     * Checks the provided object schema.
     *
     * @param {any} layout
     * @return {boolean}
     */
    checkSchema(layout: any): boolean;
    /**
     * Checks data agains the provided schema.
     *
     * @param {Object} data
     * @param {ObjectSchema} layout
     * @return {boolean}
     */
    checkAgainstSchema(data: {}, layout: ObjectSchema): boolean;
}
export declare const Joi: any;

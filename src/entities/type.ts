import { BooleanSchema, StringSchema, NumberSchema, DateSchema, ObjectSchema, Schema, ArraySchema } from '@types/joi'
import { Moment } from 'moment'
import Model from './model'
import { Joi } from '../services/validator'
import Instance from './instance'

export default class Type {
  /**
   * Boolean entry type.
   *
   * @param {null|boolean|function} defaultValue
   * @param {string} Optional callbackName
   * @return {BooleanSchema}
   */
  public static boolean (defaultValue: any = null, callbackName?: string): BooleanSchema {
    return Joi.boolean().allow(null)
      .default(defaultValue, callbackName)
  }

  /**
   * String entry type.
   *
   * @param {null|string|function} defaultValue
   * @param {string} Optional callbackName
   * @return {StringSchema}
   */
  public static string (defaultValue: any = null, callbackName?: string): StringSchema {
    return Joi.string().allow(null)
      .default(defaultValue, callbackName)
  }

  /**
   * Integer entry type.
   *
   * @param {null|number|function} defaultValue
   * @param {string} Optional callbackName
   * @return {NumberSchema}
   */
  public static integer (defaultValue: any = null, callbackName?: string): NumberSchema {
    return Joi.number().integer().allow(null)
      .default(defaultValue, callbackName)
  }

  /**
   * Number entry type.
   *
   * @param {null|number|function} defaultValue
   * @param {string} Optional callbackName
   * @return {NumberSchema}
   */
  public static number (defaultValue: any = null, callbackName?: string): NumberSchema {
    return Joi.number().allow(null)
      .default(defaultValue, callbackName)
  }

  /**
   * Date entry type.
   *
   * @param {null|number|string|Moment|function} defaultValue
   * @param {string} Optional callbackName
   * @return {DateSchema}
   */
  public static date (defaultValue: any = null, callbackName?: string): DateSchema {
    return Joi.momentdate().valid().allow(null)
      .default(defaultValue, callbackName)
  }

  /**
   * Object entry type.
   *
   * @param {Object} schema
   * @param {Object|Function} defaultValue
   * @param {string} Optional callbackName
   * @return {ObjectSchema}
   */
  public static object (schema: any, defaultValue: any = null, callbackName?: string): ObjectSchema {
    return Joi.object().keys(schema).allow(null)
      .default(defaultValue, callbackName)
  }

  /**
   * Array entry type.
   *
   * @param {Type} itemType
   * @param {Array} defaultValue
   * @param {string} Optional callbackName
   * @return {Type}
   */
  public static array (itemType: Schema, defaultValue = [], callbackName?: string): ArraySchema {
    return Joi.array().items(itemType)
      .default(defaultValue, callbackName)
  }

  /**
   * Reference entry type.
   *
   * @param {Model} model
   * @return {Type}
   */
  public static reference (model: Model): Type {
    return Joi.reference().valid()
      .default(new Instance(null, {
        $type: 'reference',
        docId: null,
        docType: model.name
      }, null, model))
  }
}

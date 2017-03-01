const moment = require('moment')
import { Moment } from 'moment'
import Model from './model'

// Ensure that moment treats invalid date as truly invalid date
// without the annoying deprecation warning.
moment.createFromInputFallback = config => {
  config._d = new Date(NaN)
}

export default class Type {
  /**
   * Boolean entry type.
   *
   * @param {null|boolean|function} defaultValue
   * @return {Type}
   */
  public static boolean (defaultValue: any = null): Type {
    return new Type('boolean', defaultValue)
  }

  /**
   * String entry type.
   *
   * @param {null|string|function} defaultValue
   * @return {Type}
   */
  public static string (defaultValue: any = null): Type {
    return new Type('string', defaultValue)
  }

  /**
   * Integer entry type.
   *
   * @param {null|number|function} defaultValue
   * @return {Type}
   */
  public static integer (defaultValue: any = null): Type {
    return new Type('integer', defaultValue)
  }

  /**
   * Number entry type.
   *
   * @param {null|number|function} defaultValue
   * @return {Type}
   */
  public static number (defaultValue: any = null): Type {
    return new Type('number', defaultValue)
  }

  /**
   * Date entry type.
   *
   * @param {null|number|string|Moment|function} defaultValue
   * @return {Type}
   */
  public static date (defaultValue = null): Type {
    return new Type('date', defaultValue)
  }

  /**
   * Array entry type.
   *
   * @param {Array} defaultValue
   * @return {Type}
   */
  public static array (defaultValue = []): Type {
    return new Type('array', defaultValue)
  }

  /**
   * Reference entry type.
   *
   * @param {Model} model
   * @return {Type}
   */
  public static reference (model: Model): Type {
    return new Type('reference', {
      $type: 'reference',
      docType: model.name,
      docId: null
    })
  }

  /**
   * Type of the entry.
   *
   * {string}
   */
  protected type: string

  /**
   * Default value of the entry.
   *
   * {null|boolean|number|string|Moment|function}
   */
  protected defaultValue: any

  /**
   * Type constructor.
   *
   * @param {string} type
   * @param {null|boolean|number|string|Moment|function} defaultValue
   */
  constructor (type: string, defaultValue: any) {
    this.type = type
    this.defaultValue = defaultValue

    this.guardAgainstInvalidValue(this.getDefaultValue())
  }

  /**
   * Provides the type of the entry.
   *
   * @return {string}
   */
  public getType (): string {
    return this.type
  }

  /**
   * Provides the default value for the type.
   *
   * @return {null|boolean|number|string|Moment|function}
   */
  public getDefaultValue (): any {
    let value = this.defaultValue

    if (typeof value === 'function') {
      value = this.defaultValue()
    }

    if (this.type === 'date') {
      value = this.convertDateToMoment(value)
    }

    return value
  }

  /**
   * Checks the provided value for the type.
   *
   * @param {any} value
   * @return {boolean}
   */
  public check (value: any): boolean {
    if (this.type === 'date') {
      value = this.convertDateToMoment(value)
    }

    return this.guardAgainstInvalidValue(value)
  }

  /**
   * Tries to convert the entry value to the moment date format.
   *
   * @param {null|boolean|number|string|Moment} value
   * @return {null|Moment}
   */
  protected convertDateToMoment (value: any): null|Moment {
    switch (typeof value) {
      case 'number':
      case 'string':
      case 'boolean':
        value = moment(value)

      default:
        break
    }

    return value
  }

  /**
   * Checks if entry value is valid.
   */
  protected guardAgainstInvalidValue (value: any): boolean {
    if (value !== null) {
      switch (this.type) {
        case 'date':
          value = this.convertDateToMoment(value)

          if (!value.isValid()) {
            throw new TypeError(`Invalid 'date' format.`)
          }
          break

        case 'integer':
          if (!Number.isInteger(value)) {
            throw new TypeError(`Invalid 'integer' format.`)
          }
          break

        case 'reference':
          /* istanbul ignore if */
          if (!
              (value.hasOwnProperty('$type')
            && value.hasOwnProperty('docId')
            && value.hasOwnProperty('docType'))
          ) {
            throw new TypeError(`Invalid 'reference' format.`)
          }
          break

        case 'array':
          if (!Array.isArray(value)) {
            throw new TypeError(`Invalid 'array' format.`)
          }
          break

        default:
          if (typeof value !== this.type) {
            throw new TypeError(`Invalid '${this.type}' format.`)
          }
          break
      }
    }

    return true
  }
}

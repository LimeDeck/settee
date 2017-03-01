import { buildKey } from '../utils'
import { KeyError } from '../errors'

/**
 * Abstract class for generating document keys.
 */
export default class Key {

  /**
   * Id part of the key.
   */
  protected id: null|string

  /**
   * Key value.
   */
  protected key: null|string

  /**
   * Schema name.
   */
  protected schemaName: string

  /**
   * Set of options.
   */
  protected options: {
    index: undefined|string,
    instance: any
  }

  /**
   * Key constructor.
   */
  constructor (schemaName: string, options: any = {}) {
    if (this.constructor === Key) {
      throw new KeyError('Can not construct abstract class `Key`.')
    }

    if (!schemaName) {
      throw new KeyError('Schema name is required for key generation.')
    }

    this.id = null
    this.key = null
    this.schemaName = schemaName
    this.options = options

    this.generate()
  }

  /**
   * Provides id part of the key.
   */
  public getId (): null|string {
    return this.id
  }

  /**
   * Sets the id value and builds the key.
   *
   * @param {string} id
   */
  public setId (id: string): Key {
    this.id = id

    this.key = buildKey(this.schemaName, id)

    return this
  }

  /**
   * Provides the generated key.
   */
  public getKey (): null|string {
    return this.key
  }

  /**
   * Generates a key for the schema.
   *
   * @throws {KeyError}
   */
  protected generate (): void {
    throw new KeyError('Do not call abstract method generate from child.')
  }
}

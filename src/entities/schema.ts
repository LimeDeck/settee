import { settee, Type } from '../index'
import { Layout, CouchbaseIndex, SchemaIndexes } from '../typings'
import Storage from '../storage'
import Validator from '../services/validator'
import { ObjectSchema } from 'joi'

export default class Schema {
  /**
   * Name of the schema.
   *
   * @type {string}
   */
  public name: string

  /**
   * Layout of the schema.
   *
   * @type {ObjectSchema}
   */
  public layout: ObjectSchema

  /**
   * List of registered indexes for the schema.
   *
   * @type {SchemaIndexes}
   */
  public indexes: SchemaIndexes = {}

  /**
   * Active storage instance.
   *
   * @type {Storage}
   */
  protected storage: Storage

  /**
   * Validator instance.
   *
   * @type {Validator}
   */
  protected validator: Validator

  /**
   * Schema constructor.
   *
   * @param {string} name
   * @param {Layout} layout
   */
  constructor (name: string, layout: Layout) {
    this.validator = new Validator()

    this.name = name

    // add the default fields to the schema layout
    this.layout = Type.object(
      Object.assign(layout, {
        docId: Type.string(),
        docType: Type.string()
      })
    )

    this.validator.checkSchema(this.layout)
  }

  /**
   * Sets the active storage for the schema.
   *
   * @param storage
   */
  public useStorage (storage: Storage) {
    this.storage = storage
  }

  /**
   * Provides the active storage.
   *
   * @return {Storage}
   */
  public getActiveStorage (): Storage {
    return this.storage
  }

  /**
   * Provides the validator instance.
   *
   * @return {Validator}
   */
  public getValidator (): Validator {
    return this.validator
  }

  /**
   * Adds indexes to the list.
   *
   * @param {SchemaIndex} indexes
   * @return {Schema}
   */
  public addIndexes (indexes: SchemaIndexes): Schema {
    this.indexes = indexes

    return this
  }

  /**
   * Verifies if the index is present in the database.
   *
   * @param {string} name
   * @param {string} type
   * @return {Promise<boolean>}
   */
  public async seeIndex (name: string, type: string = 'gsi'): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let options = {
        consistency: settee.consistency.REQUEST_PLUS
      }

      this.getActiveStorage().getIndexes(options)
        .then((results: CouchbaseIndex[]) => {
          results.forEach(index => {
            /* istanbul ignore else */
            if (index.name === name && index.using === type) {
              resolve(true)
            }
          })

          resolve(false)
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Drops index by name.
   *
   * @param {string} name
   * @param {Object} options
   * @return {Promise<boolean>}
   */
  public async dropIndex (name: string, options = {}): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.getActiveStorage().dropIndex(name, options)
        .then((result: boolean) => resolve(result))
        .catch(err => reject(err))
    })
  }
}

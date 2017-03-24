import Storage from '../storage'
import { buildKey } from '../utils'
import UuidKey from '../keys/uuid'
import Instance from './instance'
import QueryBuilder from '../services/queryBuilder'
import { SetteeError } from '../errors'
import Schema from './schema'
import Validator from '../services/validator'
import { Methods, ModelObject, StorageObject } from '../typings'
import { ObjectSchema } from 'joi'
import { set } from 'lodash'

export default class Model {
  /**
   * Creates a new model from schema.
   *
   * @param {Schema} schema
   * @return {Model}
   */
  public static fromSchema (schema: Schema): Model {
    return new Model(schema)
  }

  /**
   * Model name.
   */
  public name: string

  /**
   * Layout of the schema.
   */
  public layout: ObjectSchema

  /**
   * Active storage instance.
   */
  protected storage: Storage

  /**
   * Validator instance.
   */
  protected validator: Validator

  /**
   * Additional options.
   */
  protected options: any

  /**
   * List of reserved model methods.
   *
   * @type {Set<string>}
   */
  protected originalMethods: Set<string> = new Set(['addMethods', 'create', 'findRawByKey', 'findById'])

  /**
   * List of reserved instance methods.
   * @type {Set<string>}
   */
  protected originalInstanceMethods: Set<string> = new Set(['save', 'delete'])

  /**
   * List of methods forwarded to the instance.
   */
  protected instanceMethods: Methods

  /**
   * Model constructor.
   *
   * @param {Schema} schema
   * @param {Object} options
   */
  constructor (schema: Schema, options: any = {}) {
    this.name = schema.name
    this.layout = schema.layout
    this.storage = schema.getActiveStorage()
    this.validator = schema.getValidator()
    this.options = options
    this.originalMethods = new Set(['addMethods', 'create', 'findRawByKey', 'findById'])
    // TODO: add more methods
    this.originalInstanceMethods = new Set(['save', 'delete'])
    this.instanceMethods = {}
  }

  /**
   * Provides the active storage instance.
   *
   * @return {Storage}
   */
  public getStorage (): Storage {
    return this.storage
  }

  /**
   * Adds custom methods to the model.
   *
   * @param {Methods} methods
   * @return {Model}
   */
  public addMethods (methods: Methods): Model {
    for (let name in methods) {
      this.guardOverwriteOfOriginal(name)

      this[name] = methods[name].bind(this)
    }

    return this
  }

  /**
   * Adds custom methods to the instance.
   *
   * @param {Methods} methods
   * @return {Model}
   */
  public addInstanceMethods (methods: Methods): Model {
    for (let name in methods) {
      this.guardOverwriteOfInstanceOriginal(name)
    }

    this.instanceMethods = methods

    return this
  }

  /**
   * Creates a new model instance.
   *
   * @param {Object} data
   * @return {Promise<Instance>}
   */
  public async create (data): Promise<Instance> {
    return new Promise<Instance>(async (resolve, reject) => {
      try {
        data = this.validateData(data)
      } catch (err) {
        return reject(err)
      }

      let uuid = new UuidKey(this.name)

      // store docId and docType in database as well
      data.docId = uuid.getId()
      data.docType = this.name

      let instance = this.buildInstance(uuid.getKey(), data)

      this.storage.insert(instance.getKey(), instance.getDataForStorage())
        .then(async ({ cas }) => {
          instance.setCas(cas)

          resolve(instance)
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Creates a new query builder instance.
   *
   * @param {Object} options
   * @return {QueryBuilder}
   */
  public query (options = {}): QueryBuilder {
    options = Object.assign(options, {
      model: this
    })

    return new QueryBuilder(this.getStorage(), this.name, options)
  }

  /**
   * Shorthand for creating a new QB instance.
   *
   * @param {Object} options
   * @return {QueryBuilder}
   */
  public q (options = {}): QueryBuilder {
    return this.query(options)
  }

  /**
   * Executes a raw query.
   *
   * @param {string} query
   * @param {Object} params
   * @param {Object} options
   * @return {Promise<Array<{}>>}
   */
  public async rawQuery (query: string, params, options = {}): Promise<Array<{}>> {
    return new Promise<Array<{}>>((resolve, reject) => {
      this.storage.executeQuery(query, params, options)
        .then((results: any[]) => {
          let entries = []

          results.forEach(result => {
            let key = this.buildKey(result.docId)

            entries.push(this.buildInstance(key, result))
          })

          resolve(entries)
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Provides a single Couchbase entry by its key.
   *
   * @param {string} key
   * @return {Promise<ModelObject>}
   */
  public async findRawByKey (key: string): Promise<ModelObject> {
    return new Promise<ModelObject>((resolve, reject) => {
      this.storage.get(key)
        .then((result: StorageObject) => {
          resolve({ data: result.value, cas: result.cas })
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Finds model instance by id.
   *
   * @param {string} id
   * @return {Promise<Instance>}
   */
  public async findById (id: string): Promise<Instance> {
    let key = this.buildKey(id)

    return new Promise<Instance>((resolve, reject) => {
      this.findRawByKey(key)
        .then(result => {
          resolve(this.buildInstance(key, result.data, result.cas))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Provides multiple Couchbase entries by their keys.
   *
   * @param {string[]} keys
   * @return {Promise<ModelObject[]>}
   */
  public async findMatchingKeys (keys: string[]): Promise<ModelObject[]> {
    return new Promise<ModelObject[]>((resolve, reject) => {
      this.storage.getMulti(keys)
        .then(results => {
          let resources = []

          for (let key in results) {
            /* istanbul ignore else */
            if (results.hasOwnProperty(key)) {
              if (results[key].error) {
                return reject(
                  new SetteeError(`Entry '${keys[key]}' is not available.`)
                )
              }

              resources.push({
                key: keys[key],
                data: results[key].value,
                cas: results[key].cas
              })
            }
          }

          resolve(resources)
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Finds model instances by their ids.
   *
   * @param {string[]} ids
   * @return {Promise<Instance[]>}
   */
  public async findMatchingIds (ids: string[]): Promise<Instance[]> {
    return new Promise<Instance[]>((resolve, reject) => {
      let keys = ids.map((id: string) => this.buildKey(id))

      this.findMatchingKeys(keys)
        .then(resources => {
          resolve(
            resources.map(resource => {
              return this.buildInstance(resource.key, resource.data, resource.cas)
            })
          )
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Deletes a Couchbase entry by id.
   *
   * @param {string} id
   * @return {Promise<boolean>}
   */
  public async deleteById (id: string): Promise<boolean> {
    let key = this.buildKey(id)

    return new Promise<boolean>((resolve, reject) => {
      this.storage.remove(key)
        .then(result => resolve(true))
        .catch(err => reject(err))
    })
  }

  /**
   * Checks if the provided data matches the model schema.
   *
   * @param {Object} data
   * @return {boolean}
   */
  public validateData (data: any): boolean {
    return this.validator.checkAgainstSchema(data, this.layout)
  }

  /**
   * Builds the Couchbase key from id.
   *
   * @param {string} id
   * @return {string}
   */
  protected buildKey (id: string): string {
    return buildKey(this.name, id)
  }

  /**
   * Builds a model instance from the data.
   *
   * @param {string} key
   * @param {Object} data
   * @param {CAS} cas
   * @return {Instance}
   */
  protected buildInstance (key: string, data, cas = null): Instance {
    return new Instance(key, data, cas, this, {
      instanceMethods: this.instanceMethods
    })
  }

  /**
   * Disallows the overwrite of model methods.
   *
   * @param {string} name
   */
  protected guardOverwriteOfOriginal (name: string): void {
    if (this.originalMethods.has(name)) {
      throw new SetteeError(`Method '${name}' cannot be overwritten.`)
    }
  }

  /**
   * Disallows the overwrite of model instance methods.
   *
   * @param {string} name
   */
  protected guardOverwriteOfInstanceOriginal (name: string): void {
    if (this.originalInstanceMethods.has(name)) {
      throw new SetteeError(`Method '${name}' cannot be overwritten on the model instance.`)
    }
  }
}

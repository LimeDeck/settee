import { IndexData, Index } from '../typings'
import Storage from '../storage'
import Schema from '../entities/schema'
import QueryBuilder from '../services/queryBuilder'
import { SetteeError, StorageError } from '../errors'

export default class Indexer {
  /**
   * Map of N1QL indexes to be managed.
   *
   * @type {Map<string, IndexData>}
   */
  public indexes: Map<string, IndexData> = new Map()

  /**
   * Storage instance.
   *
   * @type {Storage}
   */
  protected storage: Storage

  /**
   * Indexer constructor.
   *
   * @param {Storage} storage
   */
  constructor (storage: Storage) {
    this.storage = storage
  }

  /**
   * Validates and adds indexes to the pool.
   *
   * @param {Schema} schema
   */
  public addIndexes (schema: Schema): void {
    // register the main docType index for convenience
    this.indexes.set('Settee#docType', {
      schemaName: schema.name,
      indexName: 'findByDocType',
      index: { by: 'docType' }
    })

    for (let indexName in schema.indexes) {
      let index = schema.indexes[indexName]

      if (!this.validateIndex(index)) {
        throw new SetteeError(`Index '${indexName}' has invalid format.`)
      }

      let schemaName = schema.name
      let indexKey = `${schemaName}#${indexName}`
      let indexData = { schemaName, indexName, index }

      this.indexes.set(indexKey, indexData)
    }
  }

  /**
   * Registers indexes.
   *
   * @return {Promise<boolean>}
   */
  public async registerIndexes (): Promise<boolean> {
    try {
      await Promise.all(
        Array.from(this.indexes).map(([indexKey, indexData]) => {
          return this.addN1qlIndex(indexKey, indexData)
        })
      )
    } catch (err) {
      throw new SetteeError('Unable to register the indexes.')
    }

    return this.storage.buildDeferredIndexes()
  }

  /**
   * Validates that index has the necessary properties.
   *
   * @param {Index} index
   * @return {boolean}
   */
  protected validateIndex (index: Index): boolean {
    return index.hasOwnProperty('by')
      && typeof index.by === 'string' || Array.isArray(index.by)
  }

  /**
   * Adds N1QL indexes to the bucket.
   *
   * @param {string} name
   * @param {IndexData} indexData
   * @return {Promise<boolean>}
   */
  protected async addN1qlIndex (name: string, indexData: IndexData): Promise<boolean> {
    let indexFields = Array.isArray(indexData.index.by)
      ? indexData.index.by
      : [indexData.index.by]

    return new Promise<boolean>((resolve, reject) => {
      this.newQuery(indexData.schemaName)
        .createIndex(name, indexFields)
        .then((result: boolean) => resolve(result))
        .catch((err: StorageError) => {
          if (err.message.includes('already exists')) {
            return resolve(true)
          }

          return reject(err)
        })
    })
  }

  /**
   * Provides a new Query Builder instance.
   *
   * @param {string} schemaName
   * @return {QueryBuilder}
   */
  protected newQuery (schemaName: string): QueryBuilder {
    return new QueryBuilder(this.storage, schemaName)
  }
}

import { Cluster, N1qlQuery } from 'couchbase'
const consistencies = N1qlQuery.Consistency

import { SetteeError } from './errors'
import Storage from './storage'
import Indexer from './indexes/indexer'
import Model from './entities/model'
import Schema from './entities/schema'
import { Bucket } from './typings'
import { ObjectSchema } from 'joi'

export default class Settee {
  /**
   * Container for registered schemas.
   */
  public registeredSchemas: Map<string, ObjectSchema> = new Map()

  /**
   * Container for registered models.
   */
  public registeredModels: Map<string, Model> = new Map()

  /**
   * Available consistencies for Couchbase storage actions.
   */
  public consistency: {
    NOT_BOUND: number,
    REQUEST_PLUS: number,
    STATEMENT_PLUS: number
  }

  /**
   * Bucket instance.
   */
  protected bucket: Bucket

  /**
   * Storage instance.
   */
  protected storage: Storage

  /**
   * Indexer instance.
   */
  protected indexer: Indexer

  /**
   * Settee constructor.
   */
  constructor () {
    this.consistency = {
      NOT_BOUND: consistencies.NOT_BOUND,
      REQUEST_PLUS: consistencies.REQUEST_PLUS,
      STATEMENT_PLUS: consistencies.STATEMENT_PLUS
    }
  }

  /**
   * Sets the active bucket.
   *
   * @param {Bucket} bucket
   */
  public useBucket (bucket: Bucket) {
    if (!this.isValidBucket(bucket)) {
      throw new SetteeError('Provided bucket object is not a proper Bucket|MockBucket type.')
    }

    this.bucket = bucket
    this.storage = new Storage(bucket)
    this.indexer = new Indexer(this.getStorage())
  }

  /**
   * Provides the bucket instance.
   *
   * @return {Bucket}
   */
  public getBucket (): Bucket {
    return this.bucket
  }

  /**
   * Provides the storage instance.
   *
   * @return {Storage}
   */
  public getStorage (): Storage {
    return this.storage
  }

  /**
   * Provides a model based on the schema.
   *
   * @param {Schema} schema
   * @return {Model}
   */
  public buildModel (schema: Schema): Model {
    if (!this.getStorage()) {
      throw new SetteeError(`You must call 'settee.useBucket(bucket)' before building a model.`)
    }

    schema.useStorage(this.getStorage())

    this.indexer.addIndexes(schema)

    let model = Model.fromSchema(schema)

    this.registeredSchemas.set(schema.name.toLowerCase(), schema.layout)

    return model
  }

  /**
   * Registers a set of provided models.
   *
   * @param {Model[]} models
   */
  public registerModels (models: Model[]): void {
    models.forEach(model => {
      this.registeredModels.set(model.name.toLowerCase(), model)
    })
  }

  /**
   * Provides a registered model.
   *
   * @param {string} name
   * @return {Model}
   */
  public getModel (name: string): Model {
    if (!this.registeredModels.has(name.toLowerCase())) {
      throw new SetteeError(`Model '${name}' is not available.`)
    }

    return this.registeredModels.get(name.toLowerCase())
  }

  /**
   * Builds deferred indexes.
   *
   * @return {Promise<boolean>}
   */
  public async buildIndexes (): Promise<boolean> {
    return this.indexer.registerIndexes()
  }

  /**
   * Establishes the connection to the bucket. Sets active bucket.
   *
   * @param {string} clusterUrl
   * @param {string} bucketName
   * @returns {Promise<Bucket>}
   */
  public async connect (clusterUrl: string, bucketName: string): Promise<Bucket> {
    return new Promise<Bucket>((resolve, reject) => {
      const cluster = new Cluster(clusterUrl)
      const bucket = cluster.openBucket(bucketName)

      /* istanbul ignore if */
      if (!this.isValidBucket(bucket)) {
        return reject(new SetteeError('Invalid bucket type.'))
      }

      bucket.on('connect', () => {
        this.useBucket(bucket)
        resolve(bucket)
      })

      bucket.on('error', () => {
        return reject(new SetteeError(
          'Connection to the bucket could not be established.'
        ))
      })
    })
  }

  /**
   * Terminates the connection to the bucket.
   *
   * @return {Promise<void>}
   */
  public async disconnect () {
    if (!this.getBucket() && !this.getStorage()) {
      throw new SetteeError('Unable to disconnect since you are not connected to a bucket.')
    }

    await this.getStorage().disconnect()
    this.bucket = null
    this.storage = null
    this.registeredSchemas = new Map()
  }

  /**
   * Verifies if the bucket is valid.
   *
   * @param {any} bucket
   * @return {boolean}
   */
  protected isValidBucket (bucket): bucket is Bucket {
    return bucket.constructor && ['Bucket', 'MockBucket'].includes(bucket.constructor.name)
  }
}

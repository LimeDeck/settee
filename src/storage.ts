import { errors, N1qlQuery, CouchbaseError, ViewQuery } from 'couchbase'
import { StorageError } from './errors'
import { BucketManager, Bucket, CbResult, CbGetResult, CbMultiGetResult, CAS } from './typings'

export default class Storage {
  /**
   * Bucket instance.
   */
  protected bucket: Bucket

  /**
   * Storage constructor.
   *
   * @param {Bucket} bucket
   */
  constructor (bucket: Bucket) {
    this.bucket = bucket
  }

  /**
   * Provides the bucket manager instance.
   *
   * @return {BucketManager}
   */
  public getManager (): BucketManager {
    return this.bucket.manager()
  }

  /**
   * Provides a bucket name.
   *
   * @return {string}
   */
  public getBucketName (): string {
    return this.bucket._name
  }

  /**
   * Disconnects the connection to the bucket.
   */
  public disconnect (): void {
    return this.bucket.disconnect()
  }

  /**
   * Gets the entry by the key.
   *
   * @param key
   * @param options
   * @return {Promise<CbGetResult>}
   */
  public async get (key: string, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      this.bucket.get(
        key.toString(), options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Gets entries by multiple keys.
   *
   * @param {string[]} keys
   * @param {Object} options
   * @return {Promise<CbMultiGetResult>}
   */
  public async getMulti (keys: string[], options: any = {}): Promise<CbMultiGetResult> {
    return new Promise<CbMultiGetResult>((resolve, reject) => {
      this.bucket.getMulti(
        keys, options,
        (err: number, results: CbMultiGetResult) => {
          /* istanbul ignore next */
          if (err && typeof err !== 'number') {
            return reject(new StorageError('Unable to get results.', null))
          }

          return resolve(results)
        }
      )
    })
  }

  /**
   * Gets and updates the expiration of an entry by key.
   *
   * @param {string} key
   * @param {integer} expiry
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
  public async getAndTouch (key: string, expiry: number, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      return this.bucket.getAndTouch(
        key.toString(), expiry, options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Gets by key and locks the entry.
   *
   * @param {string} key
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
  public async getAndLock (key: string, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      return this.bucket.getAndLock(
        key.toString(), options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Inserts a new entry to the database.
   *
   * @param {string} key
   * @param {Object} data
   * @param {Object} options
   * @return {Promise<CbResult>}
   */
  public async insert (key: string, data: {}, options: any = {}): Promise<CbResult> {
    return new Promise<CbResult>((resolve, reject) => {
      return this.bucket.insert(
        key.toString(), data, options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Appends a string to a string only entry.
   *
   * @param {string} key
   * @param {string} value
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
  public async append (key: string, value: string, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      return this.bucket.append(
        key.toString(), value, options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Prepends a string to a string only entry.
   *
   * @param {string} key
   * @param {string} value
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
  public async prepend (key: string, value: string, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      return this.bucket.prepend(
        key.toString(), value, options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Adds a number to a number only entry.
   *
   * @param {string} key
   * @param {number} value
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
  public async counter (key: string, value: number = 1, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      return this.bucket.counter(
        key.toString(), value, options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Executes a N1QL or View query and returns a raw result
   *
   * @param {N1qlQuery|ViewQuery} query
   * @param {Object} bindings
   * @return {Promise<any[]>}
   */
  public async query (query: N1qlQuery|ViewQuery, bindings = {}): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      return this.bucket.query(query, bindings, (err, response) => {
        if (err) {
          return reject(new StorageError(err.message, err.code))
        }

        return resolve(response)
      })
    })
  }

  /**
   * Executes a string N1QL query and returns sanitized results.
   *
   * @param {string} query
   * @param {Object} bindings
   * @param {Object} options
   * @return {Promise<any[]>}
   */
  public async executeQuery (query: string, bindings: {}, options: any = {}): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      let n1ql = N1qlQuery.fromString(query)

      if (options.consistency) {
        n1ql.consistency(options.consistency)
      }

      this.query(n1ql, bindings)
        .then((results: any[]) => {
          resolve(results.map(result => {
            return result[this.getBucketName()] || result
          }))
        })
        .catch(err => reject(new StorageError(err.message, err.code)))
    })
  }

  /**
   * Removes the entry from the database.
   *
   * @param {string} key
   * @param {Object} options
   * @return {Promise<CbResult>}
   */
  public async remove (key: string, options: any = {}): Promise<CbResult> {
    return new Promise<CbResult>((resolve, reject) => {
      return this.bucket.remove(
        key.toString(), options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Replaces the entry by another value.
   *
   * @param {string} key
   * @param {any} value
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
  public async replace (key: string, value, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      return this.bucket.replace(
        key.toString(), value, options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Replaces or creates the entry.
   *
   * @param {string} key
   * @param {any} value
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
  public async upsert (key: string, value, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      return this.bucket.upsert(
        key.toString(), value, options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * Sets the expiration for the entry.
   *
   * @param {string} key
   * @param {number} expiry
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
  public async touch (key: string, expiry: number, options: any = {}): Promise<CbGetResult> {
    return new Promise<CbGetResult>((resolve, reject) => {
      return this.bucket.touch(
        key.toString(), expiry, options,
        (err: CouchbaseError, result: CbGetResult) => {
          this.storageCallback(err, result, resolve, reject)
        }
      )
    })
  }

  /**
   * It unlocks the entry by key with the correct CAS.
   *
   * @param {string} key
   * @param {CAS} cas
   * @param {Object} options
   * @return {Promise<CbGetResult>}
   */
    public async unlock (key: string, cas: CAS, options: any = {}): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      return this.bucket.unlock(
        key.toString(), cas, options,
        (err: CouchbaseError, result) => {
        /* istanbul ignore if */
        if (err) {
          return reject(new StorageError(err.message, err.code))
        }

        return resolve(true)
      })
    })
  }

  /**
   * Verifies if the key exists in the cluster.
   *
   * @param key
   * @return {Promise<boolean>}
   */
  public async exists (key: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.insert(key, true, { expiry: 1 })
        .then(() => resolve(false))
        .catch((err: CouchbaseError) => {
          /* istanbul ignore else */
          if (err.code === errors.keyAlreadyExists) {
            return resolve(true)
          }

          /* istanbul ignore next */
          return reject(new StorageError(err.message, err.code))
        })
    })
  }

  /**
   * Creates an index.
   *
   * @param {string} name
   * @param {string[]} indexFields
   * @param {Object} options
   * @return {Promise<boolean>}
   */
  public async createIndex (name: string, indexFields: string[], options: any = {}): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.getManager().createIndex(
        name, indexFields, options,
        (err: CouchbaseError) => {
        if (err) {
          return reject(new StorageError(err.message, err.code))
        }

        resolve(true)
      })
    })
  }

  /**
   * Drops an index.
   *
   * @param {string} name
   * @param {Object} options
   * @return {Promise<boolean>}
   */
  public async dropIndex (name: string, options: any = {}): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.getManager().dropIndex(name, options,
        (err: CouchbaseError) => {
        if (err) {
          return reject(new StorageError(err.message, err.code))
        }

        resolve(true)
      })
    })
  }

  /**
   * Provides an array of present indexes.
   *
   * @param {Object} options
   * @return {Promise<Array<{}>>}
   */
  public async getIndexes (options: any = {}): Promise<Array<{}>> {
    return new Promise<Array<{}>>((resolve, reject) => {
      let query = 'SELECT `indexes`.* FROM system:indexes'

      let n1ql = N1qlQuery.fromString(query)

      if (options.consistency) {
        n1ql.consistency(options.consistency)
      }

      this.query(n1ql, {})
        .then(results => resolve(results))
        .catch(err => reject(new StorageError(err.message, err.code)))
    })
  }

  /**
   * Builds deferred indexes.
   *
   * @return {Promise<boolean>}
   */
  public async buildDeferredIndexes (): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.getIndexes()
        .then(async (indexes: any) => {
          let deferredList = indexes.reduce((carry, index) => {
            if (['deferred', 'pending'].includes(index.state)) {
              carry.push('`' + index.name + '`')
            }

            return carry
          }, [])

          if (deferredList.length === 0) {
            resolve(true)
          }

          let query = 'BUILD INDEX ON ' +
            '`' + this.bucket._name + '` ' +
            '(' + deferredList.join(', ') + ')'

          await this.executeQuery(query, {})

          resolve(true)
        })
        .catch(err => reject(new StorageError(err.message, err.code)))
    })
  }

  /**
   * General Couchbase callback.
   *
   * @param {CouchbaseError} err
   * @param {CbGetResult} result
   * @param {Promise.resolve} resolve
   * @param {Promise.reject} reject
   * @return {any}
   */
  protected storageCallback (err: CouchbaseError, result: CbGetResult, resolve, reject) {
    if (err) {
      return reject(new StorageError(err.message, err.code))
    }

    return resolve(result)
  }
}

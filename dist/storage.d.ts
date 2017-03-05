import { N1qlQuery, CouchbaseError, ViewQuery } from 'couchbase';
import { BucketManager, Bucket, CbResult, CbGetResult, CbMultiGetResult, CAS } from './typings';
export default class Storage {
    /**
     * Bucket instance.
     */
    protected bucket: Bucket;
    /**
     * Storage constructor.
     *
     * @param {Bucket} bucket
     */
    constructor(bucket: Bucket);
    /**
     * Provides the bucket manager instance.
     *
     * @return {BucketManager}
     */
    getManager(): BucketManager;
    /**
     * Provides a bucket name.
     *
     * @return {string}
     */
    getBucketName(): string;
    /**
     * Disconnects the connection to the bucket.
     */
    disconnect(): void;
    /**
     * Gets the entry by the key.
     *
     * @param key
     * @param options
     * @return {Promise<CbGetResult>}
     */
    get(key: string, options?: any): Promise<CbGetResult>;
    /**
     * Gets entries by multiple keys.
     *
     * @param {string[]} keys
     * @param {Object} options
     * @return {Promise<CbMultiGetResult>}
     */
    getMulti(keys: string[], options?: any): Promise<CbMultiGetResult>;
    /**
     * Gets and updates the expiration of an entry by key.
     *
     * @param {string} key
     * @param {integer} expiry
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    getAndTouch(key: string, expiry: number, options?: any): Promise<CbGetResult>;
    /**
     * Gets by key and locks the entry.
     *
     * @param {string} key
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    getAndLock(key: string, options?: any): Promise<CbGetResult>;
    /**
     * Inserts a new entry to the database.
     *
     * @param {string} key
     * @param {Object} data
     * @param {Object} options
     * @return {Promise<CbResult>}
     */
    insert(key: string, data: {}, options?: any): Promise<CbResult>;
    /**
     * Appends a string to a string only entry.
     *
     * @param {string} key
     * @param {string} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    append(key: string, value: string, options?: any): Promise<CbGetResult>;
    /**
     * Prepends a string to a string only entry.
     *
     * @param {string} key
     * @param {string} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    prepend(key: string, value: string, options?: any): Promise<CbGetResult>;
    /**
     * Adds a number to a number only entry.
     *
     * @param {string} key
     * @param {number} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    counter(key: string, value?: number, options?: any): Promise<CbGetResult>;
    /**
     * Executes a N1QL or View query and returns a raw result
     *
     * @param {N1qlQuery|ViewQuery} query
     * @param {Object} bindings
     * @return {Promise<any[]>}
     */
    query(query: N1qlQuery | ViewQuery, bindings?: {}): Promise<any[]>;
    /**
     * Executes a string N1QL query and returns sanitized results.
     *
     * @param {string} query
     * @param {Object} bindings
     * @param {Object} options
     * @return {Promise<any[]>}
     */
    executeQuery(query: string, bindings: {}, options?: any): Promise<any[]>;
    /**
     * Removes the entry from the database.
     *
     * @param {string} key
     * @param {Object} options
     * @return {Promise<CbResult>}
     */
    remove(key: string, options?: any): Promise<CbResult>;
    /**
     * Replaces the entry by another value.
     *
     * @param {string} key
     * @param {any} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    replace(key: string, value: any, options?: any): Promise<CbGetResult>;
    /**
     * Replaces or creates the entry.
     *
     * @param {string} key
     * @param {any} value
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    upsert(key: string, value: any, options?: any): Promise<CbGetResult>;
    /**
     * Sets the expiration for the entry.
     *
     * @param {string} key
     * @param {number} expiry
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    touch(key: string, expiry: number, options?: any): Promise<CbGetResult>;
    /**
     * It unlocks the entry by key with the correct CAS.
     *
     * @param {string} key
     * @param {CAS} cas
     * @param {Object} options
     * @return {Promise<CbGetResult>}
     */
    unlock(key: string, cas: CAS, options?: any): Promise<boolean>;
    /**
     * Verifies if the key exists in the cluster.
     *
     * @param key
     * @return {Promise<boolean>}
     */
    exists(key: string): Promise<boolean>;
    /**
     * Creates an index.
     *
     * @param {string} name
     * @param {string[]} indexFields
     * @param {Object} options
     * @return {Promise<boolean>}
     */
    createIndex(name: string, indexFields: string[], options?: any): Promise<boolean>;
    /**
     * Drops an index.
     *
     * @param {string} name
     * @param {Object} options
     * @return {Promise<boolean>}
     */
    dropIndex(name: string, options?: any): Promise<boolean>;
    /**
     * Provides an array of present indexes.
     *
     * @param {Object} options
     * @return {Promise<Array<{}>>}
     */
    getIndexes(options?: any): Promise<Array<{}>>;
    /**
     * Builds deferred indexes.
     *
     * @return {Promise<boolean>}
     */
    buildDeferredIndexes(): Promise<boolean>;
    /**
     * General Couchbase callback.
     *
     * @param {CouchbaseError} err
     * @param {CbGetResult} result
     * @param {Promise.resolve} resolve
     * @param {Promise.reject} reject
     * @return {any}
     */
    protected storageCallback(err: CouchbaseError, result: CbGetResult, resolve: any, reject: any): any;
}

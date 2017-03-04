import Storage from './storage';
import Indexer from './indexes/indexer';
import Model from './entities/model';
import Schema from './entities/schema';
import { Bucket, Layout } from './typings';
export default class Settee {
    /**
     * Container for registered schemas.
     */
    registeredSchemas: Map<string, Layout>;
    /**
     * Container for registered models.
     */
    registeredModels: Map<string, Model>;
    /**
     * Available consistencies for Couchbase storage actions.
     */
    consistency: {
        NOT_BOUND: number;
        REQUEST_PLUS: number;
        STATEMENT_PLUS: number;
    };
    /**
     * Bucket instance.
     */
    protected bucket: Bucket;
    /**
     * Storage instance.
     */
    protected storage: Storage;
    /**
     * Indexer instance.
     */
    protected indexer: Indexer;
    /**
     * Settee constructor.
     */
    constructor();
    /**
     * Sets the active bucket.
     *
     * @param {Bucket} bucket
     */
    useBucket(bucket: Bucket): void;
    /**
     * Provides the bucket instance.
     *
     * @return {Bucket}
     */
    getBucket(): Bucket;
    /**
     * Provides the storage instance.
     *
     * @return {Storage}
     */
    getStorage(): Storage;
    /**
     * Provides a model based on the schema.
     *
     * @param {Schema} schema
     * @return {Model}
     */
    buildModel(schema: Schema): Model;
    /**
     * Registers a set of provided models.
     *
     * @param {Model[]} models
     */
    registerModels(models: Model[]): void;
    /**
     * Provides a registered model.
     *
     * @param {string} name
     * @return {Model}
     */
    getModel(name: string): Model;
    /**
     * Builds deferred indexes.
     *
     * @return {Promise<boolean>}
     */
    buildIndexes(): Promise<boolean>;
    /**
     * Establishes the connection to the bucket. Sets active bucket.
     *
     * @param {string} clusterUrl
     * @param {string} bucketName
     * @returns {Promise<Bucket>}
     */
    connect(clusterUrl: string, bucketName: string): Promise<Bucket>;
    /**
     * Terminates the connection to the bucket.
     *
     * @return {Promise<void>}
     */
    disconnect(): Promise<void>;
    /**
     * Verifies if the bucket is valid.
     *
     * @param {any} bucket
     * @return {boolean}
     */
    protected isValidBucket(bucket: any): bucket is Bucket;
}

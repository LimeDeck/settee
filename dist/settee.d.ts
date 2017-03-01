import Storage from './storage';
import Indexer from './indexes/indexer';
import Model from './entities/model';
import Schema from './entities/schema';
import SchemaContainer from './services/schemaContainer';
import { Bucket } from './typings';
export declare class Settee {
    /**
     * Container for registered schemas.
     */
    registeredSchemas: SchemaContainer;
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
     * Registers a new schema.
     *
     * @param {Schema} schema
     * @return {Model}
     */
    registerSchema(schema: Schema): Model;
    /**
     * Builds deferred indexes.
     *
     * @return {Promise<boolean>}
     */
    buildIndexes(): Promise<boolean>;
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
export declare const settee: Settee;

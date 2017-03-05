import { IndexData, Index } from '../typings';
import Storage from '../storage';
import Schema from '../entities/schema';
import QueryBuilder from '../services/queryBuilder';
export default class Indexer {
    /**
     * Map of N1QL indexes to be managed.
     *
     * @type {Map<string, IndexData>}
     */
    indexes: Map<string, IndexData>;
    /**
     * Storage instance.
     *
     * @type {Storage}
     */
    protected storage: Storage;
    /**
     * Indexer constructor.
     *
     * @param {Storage} storage
     */
    constructor(storage: Storage);
    /**
     * Validates and adds indexes to the pool.
     *
     * @param {Schema} schema
     */
    addIndexes(schema: Schema): void;
    /**
     * Registers indexes.
     *
     * @return {Promise<boolean>}
     */
    registerIndexes(): Promise<boolean>;
    /**
     * Validates that index has the necessary properties.
     *
     * @param {Index} index
     * @return {boolean}
     */
    protected validateIndex(index: Index): boolean;
    /**
     * Adds N1QL indexes to the bucket.
     *
     * @param {string} name
     * @param {IndexData} indexData
     * @return {Promise<boolean>}
     */
    protected addN1qlIndex(name: string, indexData: IndexData): Promise<boolean>;
    /**
     * Provides a new Query Builder instance.
     *
     * @param {string} schemaName
     * @return {QueryBuilder}
     */
    protected newQuery(schemaName: string): QueryBuilder;
}

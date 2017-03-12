import { Layout, SchemaIndexes } from '../typings';
import Storage from '../storage';
import Validator from '../services/validator';
import { ObjectSchema } from 'joi';
export default class Schema {
    /**
     * Name of the schema.
     *
     * @type {string}
     */
    name: string;
    /**
     * Layout of the schema.
     *
     * @type {ObjectSchema}
     */
    layout: ObjectSchema;
    /**
     * List of registered indexes for the schema.
     *
     * @type {SchemaIndexes}
     */
    indexes: SchemaIndexes;
    /**
     * Active storage instance.
     *
     * @type {Storage}
     */
    protected storage: Storage;
    /**
     * Validator instance.
     *
     * @type {Validator}
     */
    protected validator: Validator;
    /**
     * Schema constructor.
     *
     * @param {string} name
     * @param {Layout} layout
     */
    constructor(name: string, layout: Layout);
    /**
     * Sets the active storage for the schema.
     *
     * @param storage
     */
    useStorage(storage: Storage): void;
    /**
     * Provides the active storage.
     *
     * @return {Storage}
     */
    getActiveStorage(): Storage;
    /**
     * Provides the validator instance.
     *
     * @return {Validator}
     */
    getValidator(): Validator;
    /**
     * Adds indexes to the list.
     *
     * @param {SchemaIndex} indexes
     * @return {Schema}
     */
    addIndexes(indexes: SchemaIndexes): Schema;
    /**
     * Verifies if the index is present in the database.
     *
     * @param {string} name
     * @param {string} type
     * @return {Promise<boolean>}
     */
    seeIndex(name: string, type?: string): Promise<boolean>;
    /**
     * Drops index by name.
     *
     * @param {string} name
     * @param {Object} options
     * @return {Promise<boolean>}
     */
    dropIndex(name: string, options?: {}): Promise<boolean>;
}

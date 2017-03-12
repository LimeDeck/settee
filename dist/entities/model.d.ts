import Storage from '../storage';
import Instance from './instance';
import QueryBuilder from '../services/queryBuilder';
import Schema from './schema';
import Validator from '../services/validator';
import { Methods, ModelObject } from '../typings';
import { ObjectSchema } from 'joi';
export default class Model {
    /**
     * Creates a new model from schema.
     *
     * @param {Schema} schema
     * @return {Model}
     */
    static fromSchema(schema: Schema): Model;
    /**
     * Model name.
     */
    name: string;
    /**
     * Layout of the schema.
     */
    layout: ObjectSchema;
    /**
     * Active storage instance.
     */
    protected storage: Storage;
    /**
     * Validator instance.
     */
    protected validator: Validator;
    /**
     * Additional options.
     */
    protected options: any;
    /**
     * List of reserved model methods.
     *
     * @type {Set<string>}
     */
    protected originalMethods: Set<string>;
    /**
     * List of reserved instance methods.
     * @type {Set<string>}
     */
    protected originalInstanceMethods: Set<string>;
    /**
     * List of methods forwarded to the instance.
     */
    protected instanceMethods: Methods;
    /**
     * Model constructor.
     *
     * @param {Schema} schema
     * @param {Object} options
     */
    constructor(schema: Schema, options?: any);
    /**
     * Provides the active storage instance.
     *
     * @return {Storage}
     */
    getStorage(): Storage;
    /**
     * Adds custom methods to the model.
     *
     * @param {Methods} methods
     * @return {Model}
     */
    addMethods(methods: Methods): Model;
    /**
     * Adds custom methods to the instance.
     *
     * @param {Methods} methods
     * @return {Model}
     */
    addInstanceMethods(methods: Methods): Model;
    /**
     * Creates a new model instance.
     *
     * @param {Object} data
     * @return {Promise<Instance>}
     */
    create(data: any): Promise<Instance>;
    /**
     * Creates a new query builder instance.
     *
     * @param {Object} options
     * @return {QueryBuilder}
     */
    query(options?: {}): QueryBuilder;
    /**
     * Shorthand for creating a new QB instance.
     *
     * @param {Object} options
     * @return {QueryBuilder}
     */
    q(options?: {}): QueryBuilder;
    /**
     * Executes a raw query.
     *
     * @param {string} query
     * @param {Object} params
     * @param {Object} options
     * @return {Promise<Array<{}>>}
     */
    rawQuery(query: string, params: any, options?: {}): Promise<Array<{}>>;
    /**
     * Provides a single Couchbase entry by its key.
     *
     * @param {string} key
     * @return {Promise<ModelObject>}
     */
    findRawByKey(key: string): Promise<ModelObject>;
    /**
     * Finds model instance by id.
     *
     * @param {string} id
     * @return {Promise<Instance>}
     */
    findById(id: string): Promise<Instance>;
    /**
     * Provides multiple Couchbase entries by their keys.
     *
     * @param {string[]} keys
     * @return {Promise<ModelObject[]>}
     */
    findMatchingKeys(keys: string[]): Promise<ModelObject[]>;
    /**
     * Finds model instances by their ids.
     *
     * @param {string[]} ids
     * @return {Promise<Instance[]>}
     */
    findMatchingIds(ids: string[]): Promise<Instance[]>;
    /**
     * Deletes a Couchbase entry by id.
     *
     * @param {string} id
     * @return {Promise<boolean>}
     */
    deleteById(id: string): Promise<boolean>;
    /**
     * Checks if the provided data matches the model schema.
     *
     * @param {Object} data
     * @return {boolean}
     */
    validateData(data: any): boolean;
    /**
     * Builds the Couchbase key from id.
     *
     * @param {string} id
     * @return {string}
     */
    protected buildKey(id: string): string;
    /**
     * Builds a model instance from the data.
     *
     * @param {string} key
     * @param {Object} data
     * @param {CAS} cas
     * @return {Instance}
     */
    protected buildInstance(key: string, data: any, cas?: any): Instance;
    /**
     * Disallows the overwrite of model methods.
     *
     * @param {string} name
     */
    protected guardOverwriteOfOriginal(name: string): void;
    /**
     * Disallows the overwrite of model instance methods.
     *
     * @param {string} name
     */
    protected guardOverwriteOfInstanceOriginal(name: string): void;
}

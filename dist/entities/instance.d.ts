import Storage from '../storage';
import Model from './model';
import { ModelInstance, ReferencedModels, Methods, CAS } from '../typings';
export default class Instance {
    /**
     * Id of the document instance.
     */
    docId: string;
    /**
     * Type of the document instance.
     */
    docType: string;
    /**
     * Type of the record. Only valid if the instance is a reference.
     */
    $type?: string;
    /**
     * Function which validates the data.
     */
    protected validateData: Function;
    /**
     * Storage instance.
     */
    protected storage: Storage;
    /**
     * Main store of instance related data.
     */
    protected modelInstance: ModelInstance;
    /**
     * Instance constructor.
     *
     * @param {string} key
     * @param {Object} data
     * @param {CAS} cas
     * @param {Model} model
     * @param {Object} options
     */
    constructor(key: string, data: any, cas: CAS, model: Model, options?: any);
    /**
     * Provides instance id.
     *
     * @return {string}
     */
    getId(): string;
    /**
     * Provides instance type.
     *
     * @return {string}
     */
    getType(): string;
    /**
     * Provides instance key.
     *
     * @return {string}
     */
    getKey(): string;
    /**
     * Provides instance cas.
     *
     * @return {CAS}
     */
    getCas(): CAS;
    /**
     * Provides referenced models of the instance.
     *
     * @return {ReferencedModels}
     */
    getReferencedModels(): ReferencedModels;
    /**
     * Sets the cas for the instance.
     *
     * @param {CAS} cas
     * @return {Instance}
     */
    setCas(cas: any): Instance;
    /**
     * Checks if the instance has been changed.
     *
     * @return {boolean}
     */
    isDirty(): boolean;
    /**
     * Saves the changed instance.
     * @return {Promise<boolean>}
     */
    save(): Promise<boolean>;
    /**
     * Deletes the instance.
     *
     * @return {Promise<boolean>}
     */
    delete(): Promise<boolean>;
    /**
     * Provides the latest data of the instance.
     *
     * @return {Object}
     */
    getData(): {};
    /**
     * Provides the latest data of the instance for storing purposes.
     *
     * @return {Object}
     */
    getDataForStorage(): {};
    /**
     * Applies the data to the instance.
     *
     * @return {void}
     */
    applyData(): void;
    /**
     * Finds
     *
     * @return {void}
     */
    protected findReferences(object: any, prev?: any, currentDepth?: number): boolean;
    /**
     * Adds methods to the instance.
     *
     * @param {Methods} methods
     * @return {Instance}
     */
    protected applyMethods(methods: Methods): Instance;
}

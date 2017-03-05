import Storage from '../storage';
import Model from './model';
import { ModelInstance, ReferencedModels, Methods, CAS } from '../typings';
export default class Instance {
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
    constructor(key: string, data: any, cas: any, model: Model, options?: any);
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
     * Applies the data to the instance.
     *
     * @param {Object} data
     * @return {void}
     */
    applyData(data: {}): void;
    /**
     * Assigns data to the model instance.
     *
     * @param {string} path
     * @param {Object} data
     * @return {Object}
     */
    protected assignData(path: string, data: {}): {};
    /**
     * Adds methods to the instance.
     *
     * @param {Methods} methods
     * @return {Instance}
     */
    protected applyMethods(methods: Methods): Instance;
}

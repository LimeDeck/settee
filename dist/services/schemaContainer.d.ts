import Schema from '../entities/schema';
import Model from '../entities/model';
import { RegisteredSchemas, RegisteredSchema } from '../typings';
export default class SchemaContainer {
    /**
     * Stored list of registered schemas.
     */
    protected registeredSchemas: RegisteredSchemas;
    /**
     * SchemaContainer constructor.
     */
    constructor();
    /**
     * Adds a schema to the list.
     *
     * @param {Schema} schema
     * @param {Model} model
     */
    add(schema: Schema, model: Model): void;
    /**
     * Provides the registered schema by name.
     *
     * @param {string} name
     * @return {RegisteredSchema}
     */
    get(name: string): RegisteredSchema;
    /**
     * Provides the registered schema's model by name.
     *
     * @param {string} name
     * @return {Model}
     */
    getModel(name: string): Model;
}

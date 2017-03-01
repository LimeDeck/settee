"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
class SchemaContainer {
    /**
     * SchemaContainer constructor.
     */
    constructor() {
        this.registeredSchemas = {};
    }
    /**
     * Adds a schema to the list.
     *
     * @param {Schema} schema
     * @param {Model} model
     */
    add(schema, model) {
        this.registeredSchemas[schema.name] = {
            model,
            layout: schema.layout
        };
    }
    /**
     * Provides the registered schema by name.
     *
     * @param {string} name
     * @return {RegisteredSchema}
     */
    get(name) {
        if (!this.registeredSchemas.hasOwnProperty(name)) {
            throw new errors_1.SetteeError(`Schema '${name}' has not been registered.`);
        }
        return this.registeredSchemas[name];
    }
    /**
     * Provides the registered schema's model by name.
     *
     * @param {string} name
     * @return {Model}
     */
    getModel(name) {
        return this.get(name).model;
    }
}
exports.default = SchemaContainer;

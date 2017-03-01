import Schema from '../entities/schema'
import { SetteeError } from '../errors'
import Model from '../entities/model'

import { RegisteredSchemas, RegisteredSchema } from '../typings'

export default class SchemaContainer {
  /**
   * Stored list of registered schemas.
   */
  protected registeredSchemas: RegisteredSchemas

  /**
   * SchemaContainer constructor.
   */
  constructor () {
    this.registeredSchemas = {}
  }

  /**
   * Adds a schema to the list.
   *
   * @param {Schema} schema
   * @param {Model} model
   */
  public add (schema: Schema, model: Model) {
    this.registeredSchemas[schema.name] = {
      model,
      layout: schema.layout
    }
  }

  /**
   * Provides the registered schema by name.
   *
   * @param {string} name
   * @return {RegisteredSchema}
   */
  public get (name: string): RegisteredSchema {
    if (!this.registeredSchemas.hasOwnProperty(name)) {
      throw new SetteeError(`Schema '${name}' has not been registered.`)
    }

    return this.registeredSchemas[name]
  }

  /**
   * Provides the registered schema's model by name.
   *
   * @param {string} name
   * @return {Model}
   */
  public getModel (name: string): Model {
    return this.get(name).model
  }
}

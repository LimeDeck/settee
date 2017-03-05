import { settee } from '../index'
import { SetteeError } from '../errors'
import Storage from '../storage'
import Model from './model'
import Type from './type'
import { get } from 'lodash'
import { ModelInstance, ReferencedModels, Methods, CAS } from '../typings'

export default class Instance {
  /**
   * Function which validates the data.
   */
  protected validateData: Function

  /**
   * Storage instance.
   */
  protected storage: Storage

  /**
   * Main store of instance related data.
   */
  protected modelInstance: ModelInstance

  /**
   * Instance constructor.
   *
   * @param {string} key
   * @param {Object} data
   * @param {CAS} cas
   * @param {Model} model
   * @param {Object} options
   */
  constructor (key: string, data, cas, model: Model, options: any = {}) {
    this.storage = model.getStorage()
    this.validateData = model.validateData.bind(model)

    this.modelInstance = {
      key,
      cas,
      data: Object.assign({}, model.layout),
      id: data.docId,
      type: data.docType,
      dirty: false,
      monitoredProperties: new Set(),
      referencedModels: []
    }

    this.applyData(data)
    this.applyMethods(options.instanceMethods || {})
  }

  /**
   * Provides instance id.
   *
   * @return {string}
   */
  public getId (): string {
    return this.modelInstance.id
  }

  /**
   * Provides instance type.
   *
   * @return {string}
   */
  public getType (): string {
    return this.modelInstance.type
  }

  /**
   * Provides instance key.
   *
   * @return {string}
   */
  public getKey (): string {
    return this.modelInstance.key
  }

  /**
   * Provides instance cas.
   *
   * @return {CAS}
   */
  public getCas (): CAS {
    return this.modelInstance.cas
  }

  /**
   * Provides referenced models of the instance.
   *
   * @return {ReferencedModels}
   */
  public getReferencedModels (): ReferencedModels {
    return this.modelInstance.referencedModels
  }

  /**
   * Sets the cas for the instance.
   *
   * @param {CAS} cas
   * @return {Instance}
   */
  public setCas (cas): Instance {
    this.modelInstance.cas = cas

    return this
  }

  /**
   * Checks if the instance has been changed.
   *
   * @return {boolean}
   */
  public isDirty (): boolean {
    return this.modelInstance.dirty
  }

  /**
   * Saves the changed instance.
   * @return {Promise<boolean>}
   */
  public async save (): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        this.validateData(this.modelInstance.data)
      } catch (err) {
        return reject(err)
      }

      if (!this.isDirty()) {
        resolve(true)
      }

      let updatedData = this.modelInstance.data

      this.storage.replace(this.getKey(), updatedData, { cas: this.getCas() })
        .then(response => resolve(true))
        .catch(err => reject(err))
    })
  }

  /**
   * Deletes the instance.
   *
   * @return {Promise<boolean>}
   */
  public async delete (): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.storage.remove(this.getKey(), { cas: this.getCas() })
        .then(async result => {
          try {
            for (let referenced of this.getReferencedModels()) {
              let referencedModel = settee.getModel(referenced.model)

              let id = get(this.getData(), `${referenced.pathToModel}.docId`)

              /* istanbul ignore else */
              if (typeof id === 'string') {
                await referencedModel.deleteById(id)
              } else {
                throw new SetteeError('Unable to get the id of the referenced model.')
              }
            }
          } catch (err) {
            return reject(err)
          }

          resolve(true)
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Provides the latest data of the instance.
   *
   * @return {Object}
   */
  public getData (): {} {
    return this.modelInstance.data
  }

  /**
   * Applies the data to the instance.
   *
   * @param {Object} data
   * @return {void}
   */
  public applyData (data: {}): void {
    for (let name in this.getData()) {
      this.modelInstance.data[name] = this.assignData(name, data)

      Object.defineProperty(this, name, {
        enumerable: true,
        configurable: true,
        get () {
          return this.modelInstance.data[name]
        },
        set (value) {
          this.modelInstance.dirty = true
          this.modelInstance.data[name] = value
        }
      })

      this.modelInstance.monitoredProperties.add(name)
    }
  }

  /**
   * Assigns data to the model instance.
   *
   * @param {string} path
   * @param {Object} data
   * @return {Object}
   */
  protected assignData (path: string, data: {}): {} {
    let layoutEntry = get(this.modelInstance.data, path)
    let value = get(data, path)

    if (layoutEntry instanceof Type) {
      if (value === undefined) {
        return layoutEntry.getDefaultValue()
      }

      if (layoutEntry.getType() === 'reference') {
        this.modelInstance.referencedModels.push({
          data: value,
          model: layoutEntry.getDefaultValue().docType,
          pathToModel: path
        })

        /* istanbul ignore else */
        if (value instanceof Instance) {
          return value
        } else {
          return layoutEntry.getDefaultValue()
        }
      }

      return value
    }

    /* istanbul ignore else */
    if (typeof layoutEntry === 'object') {
      for (let prop in layoutEntry) {
        let subPath = `${path}.${prop}`
        layoutEntry[prop] = this.assignData(subPath, data)
      }
    }

    return layoutEntry
  }

  /**
   * Adds methods to the instance.
   *
   * @param {Methods} methods
   * @return {Instance}
   */
  protected applyMethods (methods: Methods): Instance {
    for (let name in methods) {
      this[name] = methods[name].bind(this)
    }

    return this
  }
}

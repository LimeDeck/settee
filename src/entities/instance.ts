import Storage from '../storage'
import Model from './model'
import { set } from 'lodash'
import { ModelInstance, ReferencedModels, Methods, CAS } from '../typings'

export default class Instance {
  /**
   * Id of the document instance.
   */
  public docId: string

  /**
   * Type of the document instance.
   */
  public docType: string

  /**
   * Type of the record. Only valid if the instance is a reference.
   */
  public $type?: string

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
  constructor (key: string, data, cas: CAS, model: Model, options: any = {}) {
    this.storage = model.getStorage()
    this.validateData = model.validateData.bind(model)

    this.modelInstance = {
      key,
      cas,
      data,
      id: data.docId,
      type: data.docType,
      dirty: false,
      monitoredProperties: new Set(),
      referencedModels: []
    }

    this.applyData()
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
        this.validateData(this.getData())
      } catch (err) {
        return reject(err)
      }

      if (!this.isDirty()) {
        resolve(true)
      }

      this.storage.replace(this.getKey(), this.getDataForStorage(), { cas: this.getCas() })
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
      // TODO: add second arg { cas: this.getCas() } when CB is updated to 4.6.0
      this.storage.remove(this.getKey())
        .then(async () => {
          let referencedKeysToDelete = new Set()

          try {
            await Promise.all(
              this.getReferencedModels()
                .reduce((carry, referenced) => {
                  let key = `${referenced.model}::${referenced.data.getId()}`
                  if (!referencedKeysToDelete.has(key)) {
                    referencedKeysToDelete.add(key)
                    carry.push(this.storage.remove(key))
                  }

                  return carry
                }, [])
            )
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
   * Provides the latest data of the instance for storing purposes.
   *
   * @return {Object}
   */
  public getDataForStorage (): {} {
    let storageData = Object.assign({}, this.modelInstance.data)

    let monitoredKey = 0

    this.modelInstance.referencedModels.forEach(reference => {
      let baseKey = reference.pathToModel

      if (reference.pathToModel.includes('.')) {
        baseKey = reference.pathToModel.replace('.', `[${monitoredKey}].`)
        monitoredKey++
      }

      set(storageData, baseKey, {
        $type: 'reference',
        docType: reference.model,
        docId: reference.data.getId()
      })
    })

    return storageData
  }

  /**
   * Applies the data to the instance.
   *
   * @return {void}
   */
  public applyData (): void {
    this.findReferences(this.getData())

    for (let name in this.getData()) {
      Object.defineProperty(this, name, {
        enumerable: true,
        configurable: true,
        get () {
          return this.modelInstance.data[name]
        },
        set (value) {
          this.modelInstance.dirty = true

          // experimental fix for referenced arrays
          if (Array.isArray(value)) {
            let arrayEntries = {}
            arrayEntries[name] = []

            value.forEach(entry => {
              let referenceKey = Object.keys(entry)[0]
              // only process entries that are arrays of references
              /* istanbul ignore else */
              if (referenceKey && entry[referenceKey] instanceof Instance) {
                arrayEntries[name].push(entry)
              }
            })

            /* istanbul ignore else */
            if (Object.keys(arrayEntries).length > 0) {
              this.findReferences(arrayEntries)
            }
          } else {
            this.modelInstance.data[name] = value
          }
        }
      })

      this.modelInstance.monitoredProperties.add(name)
    }
  }

  /**
   * Finds
   *
   * @return {void}
   */
  protected findReferences (object, prev = null, currentDepth = 1): boolean {
    Object.keys(object).forEach(key => {
      let value = object[key]
      let isArray = Array.isArray(value)
      let type = Object.prototype.toString.call(value)
      let isObject = (
        type === '[object Object]' ||
        type === '[object Array]'
      )

      let newKey = prev ? `${prev}.${key}` : key

      if (isArray) {
        value.forEach(entry => {
          return this.findReferences(entry, newKey, currentDepth + 1)
        })
      }

      if (!isArray && isObject && Object.keys(value).length) {
        if (value instanceof Instance) {
          this.modelInstance.referencedModels.push({
            data: value,
            model: value.getType(),
            pathToModel: newKey
          })
        } else {
          return this.findReferences(value, newKey, currentDepth + 1)
        }
      }
    })

    return true
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

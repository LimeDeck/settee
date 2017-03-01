import Type from '../entities/type'
import { settee } from '../index'
import { Layout } from '../typings'

export default class Validator {
  /**
   * Checks layout of the schema recursively.
   *
   * @param {Layout} layout
   * @param {boolean} isTopLevel
   * @return {boolean}
   */
  public checkSchema (layout: Layout, isTopLevel: boolean = true): boolean {
    for (let field in layout) {
      let entry = layout[field]

      if (this.isValidType(entry, isTopLevel)) {
        continue
      }

      if (this.isNestedLayout(entry)) {
        return this.checkSchema(entry, false)
      }

      throw new TypeError(`Field '${field}' has invalid type.`)
    }

    return true
  }

  /**
   * Checks data agains the provided schema recursively.
   *
   * @param {Object} data
   * @param {Layout} layout
   * @return {boolean}
   */
  public checkAgainstSchema (data: {}, layout: Layout): boolean {
    for (let checkedField in data) {
      let checkedEntry = data[checkedField]

      if (this.isReferenceType(layout)) {
        layout = this.getReferencedLayout(layout)
      }

      if (!layout.hasOwnProperty(checkedField)) {
        throw new TypeError(
          `Field '${checkedField}' is not present in the schema.`
        )
      }

      let schemaEntry = layout[checkedField]

      if (this.isNestedLayout(checkedEntry) && this.isNestedLayout(schemaEntry)) {
        return this.checkAgainstSchema(checkedEntry, schemaEntry)
      }

      try {
        /* istanbul ignore else */
        if (schemaEntry instanceof Type) {
          schemaEntry.check(checkedEntry)
        } else {
          throw new Error()
        }
      } catch (err) {
        throw new TypeError(
          `Field '${checkedField}' has invalid type.`
        )
      }
    }

    return true
  }

  /**
   * Checks if the schema entry is of valid type.
   *
   * @param {any|Type} entry
   * @param {boolean} isTopLevel
   * @return {boolean}
   */
  protected isValidType (entry: any, isTopLevel: boolean): boolean {
    let validType = entry instanceof Type

    if (validType && this.hasNestedReference(entry, isTopLevel)) {
      throw new TypeError(
        'Referenced models must be used only on the top level'
      )
    }

    return validType
  }

  /**
   * Checks if the layout entry is a referenced layout.
   *
   * @param {Layout} layout
   * @return {boolean}
   */
  protected isReferenceType (layout: Layout): boolean {
    return layout instanceof Type && layout.getType() === 'reference'
  }

  /**
   * Checks if the provided entry is a nested layout.
   *
   * @param {any} entry
   * @return {boolean}
   */
  protected isNestedLayout (entry: any): entry is Layout {
    return typeof entry === 'object'
  }

  /**
   * Checks if the schema layout has a nested reference.
   *
   * @param {Type} entry
   * @param {boolean} isTopLevel
   * @return {boolean}
   */
  protected hasNestedReference (entry: Type, isTopLevel: boolean): boolean {
    return entry.getType() === 'reference' && !isTopLevel
  }

  /**
   * Provides the referenced layout.
   *
   * @param {Object} layout
   * @return {Layout}
   */
  protected getReferencedLayout (layout: any): Layout {
    return settee.registeredSchemas.get(
      layout.getDefaultValue().docType
    ).layout
  }
}

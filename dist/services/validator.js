"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_1 = require("../entities/type");
const index_1 = require("../index");
class Validator {
    /**
     * Checks layout of the schema recursively.
     *
     * @param {Layout} layout
     * @param {boolean} isTopLevel
     * @return {boolean}
     */
    checkSchema(layout, isTopLevel = true) {
        for (let field in layout) {
            let entry = layout[field];
            if (this.isValidType(entry, isTopLevel)) {
                continue;
            }
            if (this.isNestedLayout(entry)) {
                return this.checkSchema(entry, false);
            }
            throw new TypeError(`Field '${field}' has invalid type.`);
        }
        return true;
    }
    /**
     * Checks data agains the provided schema recursively.
     *
     * @param {Object} data
     * @param {Layout} layout
     * @return {boolean}
     */
    checkAgainstSchema(data, layout) {
        for (let checkedField in data) {
            let checkedEntry = data[checkedField];
            if (this.isReferenceType(layout)) {
                layout = this.getReferencedLayout(layout);
            }
            if (!layout.hasOwnProperty(checkedField)) {
                throw new TypeError(`Field '${checkedField}' is not present in the schema.`);
            }
            let schemaEntry = layout[checkedField];
            if (this.isNestedLayout(checkedEntry) && this.isNestedLayout(schemaEntry)) {
                return this.checkAgainstSchema(checkedEntry, schemaEntry);
            }
            try {
                /* istanbul ignore else */
                if (schemaEntry instanceof type_1.default) {
                    schemaEntry.check(checkedEntry);
                }
                else {
                    throw new Error();
                }
            }
            catch (err) {
                throw new TypeError(`Field '${checkedField}' has invalid type.`);
            }
        }
        return true;
    }
    /**
     * Checks if the schema entry is of valid type.
     *
     * @param {any|Type} entry
     * @param {boolean} isTopLevel
     * @return {boolean}
     */
    isValidType(entry, isTopLevel) {
        let validType = entry instanceof type_1.default;
        if (validType && this.hasNestedReference(entry, isTopLevel)) {
            throw new TypeError('Referenced models must be used only on the top level');
        }
        return validType;
    }
    /**
     * Checks if the layout entry is a referenced layout.
     *
     * @param {Layout} layout
     * @return {boolean}
     */
    isReferenceType(layout) {
        return layout instanceof type_1.default && layout.getType() === 'reference';
    }
    /**
     * Checks if the provided entry is a nested layout.
     *
     * @param {any} entry
     * @return {boolean}
     */
    isNestedLayout(entry) {
        return typeof entry === 'object';
    }
    /**
     * Checks if the schema layout has a nested reference.
     *
     * @param {Type} entry
     * @param {boolean} isTopLevel
     * @return {boolean}
     */
    hasNestedReference(entry, isTopLevel) {
        return entry.getType() === 'reference' && !isTopLevel;
    }
    /**
     * Provides the referenced layout.
     *
     * @param {Object} layout
     * @return {Layout}
     */
    getReferencedLayout(layout) {
        return index_1.settee.registeredSchemas.get(layout.getDefaultValue().docType).layout;
    }
}
exports.default = Validator;

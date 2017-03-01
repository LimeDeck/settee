import Type from '../entities/type';
import { Layout } from '../typings';
export default class Validator {
    /**
     * Checks layout of the schema recursively.
     *
     * @param {Layout} layout
     * @param {boolean} isTopLevel
     * @return {boolean}
     */
    checkSchema(layout: Layout, isTopLevel?: boolean): boolean;
    /**
     * Checks data agains the provided schema recursively.
     *
     * @param {Object} data
     * @param {Layout} layout
     * @return {boolean}
     */
    checkAgainstSchema(data: {}, layout: Layout): boolean;
    /**
     * Checks if the schema entry is of valid type.
     *
     * @param {any|Type} entry
     * @param {boolean} isTopLevel
     * @return {boolean}
     */
    protected isValidType(entry: any, isTopLevel: boolean): boolean;
    /**
     * Checks if the layout entry is a referenced layout.
     *
     * @param {Layout} layout
     * @return {boolean}
     */
    protected isReferenceType(layout: Layout): boolean;
    /**
     * Checks if the provided entry is a nested layout.
     *
     * @param {any} entry
     * @return {boolean}
     */
    protected isNestedLayout(entry: any): entry is Layout;
    /**
     * Checks if the schema layout has a nested reference.
     *
     * @param {Type} entry
     * @param {boolean} isTopLevel
     * @return {boolean}
     */
    protected hasNestedReference(entry: Type, isTopLevel: boolean): boolean;
    /**
     * Provides the referenced layout.
     *
     * @param {Object} layout
     * @return {Layout}
     */
    protected getReferencedLayout(layout: any): Layout;
}

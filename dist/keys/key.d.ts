/**
 * Abstract class for generating document keys.
 */
export default class Key {
    /**
     * Id part of the key.
     */
    protected id: null | string;
    /**
     * Key value.
     */
    protected key: null | string;
    /**
     * Schema name.
     */
    protected schemaName: string;
    /**
     * Set of options.
     */
    protected options: {
        index: undefined | string;
        instance: any;
    };
    /**
     * Key constructor.
     */
    constructor(schemaName: string, options?: any);
    /**
     * Provides id part of the key.
     */
    getId(): null | string;
    /**
     * Sets the id value and builds the key.
     *
     * @param {string} id
     */
    setId(id: string): Key;
    /**
     * Provides the generated key.
     */
    getKey(): null | string;
    /**
     * Generates a key for the schema.
     *
     * @throws {KeyError}
     */
    protected generate(): void;
}

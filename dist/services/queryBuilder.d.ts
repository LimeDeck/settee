import Storage from '../storage';
import Instance from '../entities/instance';
import { CAS } from '../typings';
export default class QueryBuilder {
    /**
     * Name of the active bucket.
     */
    bucketName: string;
    /**
     * Type of the document.
     */
    docType: string;
    /**
     * Additional options.
     */
    options: any;
    /**
     * Storage instance.
     */
    protected storage: Storage;
    /**
     * Allowed query operators.
     *
     * @type {Set<string>}
     */
    protected allowedOperators: Set<string>;
    /**
     * Set of bindings.
     *
     * @type {Object}
     */
    protected bindings: any;
    /**
     * Set of where clauses.
     *
     * @type {string[]}
     */
    protected wheres: string[];
    /**
     * Set of order by clauses.
     *
     * @type {string[]}
     */
    protected orderBys: string[];
    /**
     * Set of count clauses.
     *
     * @type {string[]}
     */
    protected counts: string[];
    /**
     * Limit clause.
     *
     * @type {null|string}
     */
    protected limits: null | string;
    /**
     * Offset clause.
     *
     * @type {null|string}
     */
    protected offsets: null | string;
    /**
     * QueryBuilder constructor.
     *
     * @param {Storage} storage
     * @param {string} docType
     * @param {Object} options
     */
    constructor(storage: Storage, docType: string, options?: any);
    /**
     * Provides all entries.
     *
     * @param {string|string[]} fields
     * @return {Promise<any[]>}
     */
    all(fields?: string): Promise<number | any[]>;
    /**
     * Adds a where clause.
     *
     * @param {string} field
     * @param {any} operator
     * @param {any} value
     * @return {QueryBuilder}
     */
    where(field: string, operator: any, value?: any): this;
    /**
     * Adds a where not clause.
     *
     * @param {string} field
     * @param {any} value
     * @return {QueryBuilder}
     */
    whereNot(field: string, value: any): this;
    /**
     * Adds a where in clause.
     *
     * @param {string} field
     * @param {any[]} values
     * @return {QueryBuilder}
     */
    whereIn(field: string, values: any[]): this;
    /**
     * Adds a where not in clause.
     *
     * @param {string} field
     * @param {any[]} values
     * @return {QueryBuilder}
     */
    whereNotIn(field: string, values: any[]): this;
    /**
     * Adds where between clause.
     *
     * @param {string} field
     * @param {any} min
     * @param {any} max
     * @return {QueryBuilder}
     */
    whereBetween(field: string, min: any, max: any): this;
    /**
     * Adds where not between clause.
     *
     * @param {string} field
     * @param {any} min
     * @param {any} max
     * @return {QueryBuilder}
     */
    whereNotBetween(field: string, min: any, max: any): this;
    /**
     * Adds where null clause.
     *
     * @param {string} field
     * @return {QueryBuilder}
     */
    whereNull(field: string): this;
    /**
     * Adds where not null clause.
     *
     * @param {string} field
     * @return {QueryBuilder}
     */
    whereNotNull(field: string): this;
    /**
     * Adds an offset.
     *
     * @param {integer} count
     * @return {QueryBuilder}
     */
    offset(count: number): this;
    /**
     * Adds a limit.
     *
     * @param {integer} count
     * @return {QueryBuilder}
     */
    limit(count: number): this;
    /**
     * Adds an order by clause.
     *
     * @param {string} field
     * @param {string} direction
     * @return {QueryBuilder}
     */
    orderBy(field: string, direction?: string): this;
    /**
     * Returns the first entry from the get statement.
     *
     * @param {string|string[]} fields
     * @return {Promise<any[]>}
     */
    first(fields?: string): Promise<number | any[]>;
    /**
     * Executes a count query.
     *
     * @param {string} field
     * @return {Promise<any[]|number>}
     */
    count(field?: string): Promise<any[] | number>;
    /**
     * Executes a query.
     *
     * @param {string|string[]} fields
     * @return {Promise<any[]|number>}
     */
    get(fields?: string): Promise<any[] | number>;
    /**
     * Paginates the results depending on the perPage count and page number.
     *
     * @param {number} perPage
     * @param {number} pageNumber
     * @param {string|string[]} fields
     * @return {Promise<{entries: null|Array<{}>, totalCount: number, perPage: number, pageNumber: number}>}
     */
    paginate(perPage?: number, pageNumber?: number, fields?: string): Promise<{
        entries: any;
        totalCount: number | any[];
        perPage: number;
        pageNumber: number;
    }>;
    /**
     * Creates an index.
     *
     * @param {string} name
     * @param {string[]} fields
     * @param {boolean} scoped
     * @return {Promise<boolean>}
     */
    createIndex(name: string, fields: string[], scoped?: boolean): Promise<boolean>;
    /**
     * Builds a query and bindings depending on the arguments from wheres, ordersBys, offsets and limits.
     *
     * @param {string|string[]} fields
     * @return {{query: string, bindings: any}}
     */
    prepare(fields?: string): {
        query: string;
        bindings: any;
    };
    /**
     * Pushes a where statement to the query.
     *
     * @param {string} query
     * @return {string}
     */
    protected appendWheres(query: string): string;
    /**
     * Pushes an order by statement to the query.
     *
     * @param {string} query
     * @return {string}
     */
    protected appendOrderBys(query: string): string;
    /**
     * Pushes an offset statement to the query.
     *
     * @param {string} query
     * @return {string}
     */
    protected appendOffset(query: string): string;
    /**
     * Pushes a limit statement to the query.
     *
     * @param {string} query
     * @return {string}
     */
    protected appendLimit(query: string): string;
    /**
     * Resolves a proper binding name.
     *
     * @param {string} name
     * @return {string}
     */
    protected resolveBindingName(name: string): string;
    /**
     * Builds the where object with where in statement.
     *
     * @param {string} field
     * @param {any} values
     * @param {boolean} isNegated
     * @return {QueryBuilder}
     */
    protected buildWhereIn(field: string, values: any, isNegated?: boolean): this;
    /**
     * Builds the where object with where between statement.
     *
     * @param {string} field
     * @param {any} min
     * @param {any} max
     * @param {boolean} isNegated
     * @return {QueryBuilder}
     */
    protected buildWhereBetween(field: string, min: any, max: any, isNegated?: boolean): this;
    /**
     * Builds the where object with where null statement.
     *
     * @param {string} field
     * @param {boolean} isNegated
     * @return {QueryBuilder}
     */
    protected buildWhereNull(field: string, isNegated?: boolean): this;
    /**
     * Builds a new model instance.
     *
     * @param {string} key
     * @param {object} data
     * @param {CAS} cas
     * @return {Instance}
     */
    protected buildInstance(key: string, data: {}, cas?: CAS): Instance;
}

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const instance_1 = require("../entities/instance");
const errors_1 = require("../errors");
class QueryBuilder {
    /**
     * QueryBuilder constructor.
     *
     * @param {Storage} storage
     * @param {string} docType
     * @param {Object} options
     */
    constructor(storage, docType, options = {}) {
        /**
         * Allowed query operators.
         *
         * @type {Set<string>}
         */
        this.allowedOperators = new Set([
            '=', '==', '<', '<=', '>', '>=', '!=', '<>',
            'LIKE', 'like', 'NOT LIKE', 'not like'
        ]);
        /**
         * Set of bindings.
         *
         * @type {Object}
         */
        this.bindings = {};
        /**
         * Set of where clauses.
         *
         * @type {string[]}
         */
        this.wheres = [];
        /**
         * Set of order by clauses.
         *
         * @type {string[]}
         */
        this.orderBys = [];
        /**
         * Set of count clauses.
         *
         * @type {string[]}
         */
        this.counts = [];
        /**
         * Limit clause.
         *
         * @type {null|string}
         */
        this.limits = null;
        /**
         * Offset clause.
         *
         * @type {null|string}
         */
        this.offsets = null;
        this.storage = storage;
        this.bucketName = this.storage.getBucketName();
        this.docType = docType;
        this.options = options;
    }
    /**
     * Provides all entries.
     *
     * @param {string} fields
     * @return {Promise<any[]>}
     */
    all(fields = '*') {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get(fields);
        });
    }
    /**
     * Adds a where clause.
     *
     * @param {string} field
     * @param {any} operator
     * @param {any} value
     * @return {QueryBuilder}
     */
    where(field, operator, value) {
        let bindingName = this.resolveBindingName(field);
        if (!this.allowedOperators.has(operator)) {
            if (value) {
                let allowed = Array.from(this.allowedOperators).join(', ');
                throw new Error(`Invalid operator '${operator}'. Use only ${allowed}.`);
            }
            value = operator;
            operator = '=';
        }
        this.wheres.push(`\`${field}\` ${operator} $${bindingName}`);
        this.bindings[bindingName] = value;
        return this;
    }
    /**
     * Adds a where not clause.
     *
     * @param {string} field
     * @param {any} value
     * @return {QueryBuilder}
     */
    whereNot(field, value) {
        this.where(field, '!=', value);
        return this;
    }
    /**
     * Adds a where in clause.
     *
     * @param {string} field
     * @param {any[]} values
     * @return {QueryBuilder}
     */
    whereIn(field, values) {
        return this.buildWhereIn(field, values);
    }
    /**
     * Adds a where not in clause.
     *
     * @param {string} field
     * @param {any[]} values
     * @return {QueryBuilder}
     */
    whereNotIn(field, values) {
        return this.buildWhereIn(field, values, true);
    }
    /**
     * Adds where between clause.
     *
     * @param {string} field
     * @param {any} min
     * @param {any} max
     * @return {QueryBuilder}
     */
    whereBetween(field, min, max) {
        return this.buildWhereBetween(field, min, max);
    }
    /**
     * Adds where not between clause.
     *
     * @param {string} field
     * @param {any} min
     * @param {any} max
     * @return {QueryBuilder}
     */
    whereNotBetween(field, min, max) {
        return this.buildWhereBetween(field, min, max, true);
    }
    /**
     * Adds where null clause.
     *
     * @param {string} field
     * @return {QueryBuilder}
     */
    whereNull(field) {
        return this.buildWhereNull(field);
    }
    /**
     * Adds where not null clause.
     *
     * @param {string} field
     * @return {QueryBuilder}
     */
    whereNotNull(field) {
        return this.buildWhereNull(field, true);
    }
    /**
     * Adds an offset.
     *
     * @param {integer} count
     * @return {QueryBuilder}
     */
    offset(count) {
        if (!Number.isInteger(count)) {
            throw new TypeError('OFFSET allows only integers.');
        }
        this.offsets = `OFFSET ${count}`;
        return this;
    }
    /**
     * Adds a limit.
     *
     * @param {integer} count
     * @return {QueryBuilder}
     */
    limit(count) {
        if (!Number.isInteger(count)) {
            throw new TypeError('LIMIT allows only integers.');
        }
        this.limits = `LIMIT ${count}`;
        return this;
    }
    /**
     * Adds an order by clause.
     *
     * @param {string} field
     * @param {string} direction
     * @return {QueryBuilder}
     */
    orderBy(field, direction = 'ASC') {
        direction = direction.toUpperCase();
        this.orderBys.push(`\`${field}\` ${direction}`);
        return this;
    }
    /**
     * Returns the first entry from the get statement.
     *
     * @param {string} fields
     * @return {Promise<any[]>}
     */
    first(fields = '*') {
        return __awaiter(this, void 0, void 0, function* () {
            this.limit(1);
            return this.get(fields);
        });
    }
    /**
     * Executes a count query.
     *
     * @param {string} field
     * @return {Promise<any[]|number>}
     */
    count(field = 'docType') {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get(`count(\`${field}\`) as setteeCount`);
        });
    }
    /**
     * Executes a query.
     *
     * @param {string} fields
     * @return {Promise<any[]|number>}
     */
    get(fields = '*') {
        return __awaiter(this, void 0, void 0, function* () {
            let { query, bindings } = this.prepare(fields);
            return new Promise((resolve, reject) => {
                this.storage.executeQuery(query, bindings, this.options)
                    .then((results) => {
                    let entries = [];
                    results.forEach(result => {
                        if (!result.docId && result.setteeCount) {
                            return resolve(result.setteeCount);
                        }
                        let key = utils_1.buildKey(this.docType, result.docId);
                        entries.push(this.buildInstance(key, result));
                    });
                    resolve(entries);
                })
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Paginates the results depending on the perPage count and page number.
     *
     * @param {number} perPage
     * @param {number} pageNumber
     * @param {string} fields
     * @return {Promise<{entries: null|Array<{}>, totalCount: number, perPage: number, pageNumber: number}>}
     */
    paginate(perPage = 15, pageNumber = 1, fields = '*') {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalCount = yield this.count();
                let offset = (pageNumber - 1) * perPage;
                let entries = null;
                if (totalCount > offset && pageNumber > 0) {
                    entries = yield this.offset(offset).limit(perPage).get(fields);
                }
                return { entries, totalCount, perPage, pageNumber };
            }
            catch (err) {
                throw new errors_1.SetteeError('Unable to get the paginated results.');
            }
        });
    }
    /**
     * Creates an index.
     *
     * @param {string} name
     * @param {string[]} fields
     * @param {boolean} scoped
     * @return {Promise<boolean>}
     */
    createIndex(name, fields, scoped = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `CREATE INDEX \`${name}\` ON \`${this.bucketName}\``;
            query += ` (\`${fields.join(', ')}\`)`;
            if (scoped) {
                query += ` WHERE \`docType\` = "${this.docType}"`;
            }
            query += ' WITH {"defer_build":true}';
            return new Promise((resolve, reject) => {
                this.storage.executeQuery(query, this.bindings, this.options)
                    .then(() => resolve(true))
                    .catch(err => reject(err));
            });
        });
    }
    /**
     * Builds a query and bindings depending on the arguments from wheres, ordersBys, offsets and limits.
     *
     * @param {string} fields
     * @return {{query: string, bindings: any}}
     */
    prepare(fields = '*') {
        if (Array.isArray(fields)) {
            fields = fields.join(', ');
        }
        let query = `SELECT ${fields} FROM \`${this.bucketName}\``;
        query = this.appendWheres(query);
        query = this.appendOrderBys(query);
        query = this.appendOffset(query);
        query = this.appendLimit(query);
        return { query, bindings: this.bindings };
    }
    /**
     * Pushes a where statement to the query.
     *
     * @param {string} query
     * @return {string}
     */
    appendWheres(query) {
        // ensure that we're properly scoped
        this.where('docType', this.docType);
        let where = 'WHERE ' + this.wheres.join(' AND ');
        query += ` ${where}`;
        return query;
    }
    /**
     * Pushes an order by statement to the query.
     *
     * @param {string} query
     * @return {string}
     */
    appendOrderBys(query) {
        if (this.orderBys.length > 0) {
            query += ` ORDER BY ${this.orderBys.join(', ')}`;
        }
        return query;
    }
    /**
     * Pushes an offset statement to the query.
     *
     * @param {string} query
     * @return {string}
     */
    appendOffset(query) {
        query += this.offsets ? ` ${this.offsets}` : '';
        return query;
    }
    /**
     * Pushes a limit statement to the query.
     *
     * @param {string} query
     * @return {string}
     */
    appendLimit(query) {
        query += this.limits ? ` ${this.limits}` : '';
        return query;
    }
    /**
     * Resolves a proper binding name.
     *
     * @param {string} name
     * @return {string}
     */
    resolveBindingName(name) {
        return name.replace(/[._]/g, '');
    }
    /**
     * Builds the where object with where in statement.
     *
     * @param {string} field
     * @param {any} values
     * @param {boolean} isNegated
     * @return {QueryBuilder}
     */
    buildWhereIn(field, values, isNegated = false) {
        let bindingName = this.resolveBindingName(field);
        let operator = isNegated ? 'NOT IN' : 'IN';
        this.wheres.push(`\`${field}\` ${operator} $${bindingName}`);
        this.bindings[bindingName] = values;
        return this;
    }
    /**
     * Builds the where object with where between statement.
     *
     * @param {string} field
     * @param {any} min
     * @param {any} max
     * @param {boolean} isNegated
     * @return {QueryBuilder}
     */
    buildWhereBetween(field, min, max, isNegated = false) {
        let bindingName = this.resolveBindingName(field);
        let operator = isNegated ? 'NOT BETWEEN' : 'BETWEEN';
        this.wheres.push(`\`${field}\` ${operator} $${bindingName}Min AND $${bindingName}Max`);
        this.bindings[bindingName + 'Min'] = min;
        this.bindings[bindingName + 'Max'] = max;
        return this;
    }
    /**
     * Builds the where object with where null statement.
     *
     * @param {string} field
     * @param {boolean} isNegated
     * @return {QueryBuilder}
     */
    buildWhereNull(field, isNegated = false) {
        let operator = isNegated ? 'IS NOT NULL' : 'IS NULL';
        this.wheres.push(`\`${field}\` ${operator}`);
        return this;
    }
    /**
     * Builds a new model instance.
     *
     * @param {string} key
     * @param {object} data
     * @param {CAS} cas
     * @return {Instance}
     */
    buildInstance(key, data, cas = null) {
        if (!this.options.hasOwnProperty('model')) {
            throw new errors_1.SetteeError('You cannot build model instance without the model provided via options.');
        }
        return new instance_1.default(key, data, cas, this.options.model, {
            instanceMethods: this.options.instanceMethods
        });
    }
}
exports.default = QueryBuilder;

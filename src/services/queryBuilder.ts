import { buildKey } from '../utils'
import Storage from '../storage'
import Instance from '../entities/instance'
import { SetteeError } from '../errors'
import { CAS } from '../typings'

export default class QueryBuilder {
  /**
   * Name of the active bucket.
   */
  public bucketName: string

  /**
   * Type of the document.
   */
  public docType: string

  /**
   * Additional options.
   */
  public options: any

  /**
   * Storage instance.
   */
  protected storage: Storage

  /**
   * Allowed query operators.
   *
   * @type {Set<string>}
   */
  protected allowedOperators: Set<string> = new Set([
    '=', '==', '<', '<=', '>', '>=', '!=', '<>',
    'LIKE', 'like', 'NOT LIKE', 'not like'
  ])

  /**
   * Set of bindings.
   *
   * @type {Object}
   */
  protected bindings: any = {}

  /**
   * Set of where clauses.
   *
   * @type {string[]}
   */
  protected wheres: string[] = []

  /**
   * Set of order by clauses.
   *
   * @type {string[]}
   */
  protected orderBys: string[] = []

  /**
   * Set of count clauses.
   *
   * @type {string[]}
   */
  protected counts: string[] = []

  /**
   * Limit clause.
   *
   * @type {null|string}
   */
  protected limits: null|string = null

  /**
   * Offset clause.
   *
   * @type {null|string}
   */
  protected offsets: null|string = null

  /**
   * QueryBuilder constructor.
   *
   * @param {Storage} storage
   * @param {string} docType
   * @param {Object} options
   */
  constructor (storage: Storage, docType: string, options: any = {}) {
    this.storage = storage
    this.bucketName = this.storage.getBucketName()
    this.docType = docType
    this.options = options
  }

  /**
   * Provides all entries.
   *
   * @param {string} fields
   * @return {Promise<any[]>}
   */
  public async all (fields: string = '*') {
    return this.get(fields)
  }

  /**
   * Adds a where clause.
   *
   * @param {string} field
   * @param {any} operator
   * @param {any} value
   * @return {QueryBuilder}
   */
  public where (field: string, operator: any, value?: any) {
    let bindingName = this.resolveBindingName(field)

    if (!this.allowedOperators.has(operator)) {
      if (value) {
        let allowed = Array.from(this.allowedOperators).join(', ')
        throw new Error(`Invalid operator '${operator}'. Use only ${allowed}.`)
      }

      value = operator
      operator = '='
    }

    this.wheres.push(`\`${field}\` ${operator} $${bindingName}`)
    this.bindings[bindingName] = value

    return this
  }

  /**
   * Adds a where not clause.
   *
   * @param {string} field
   * @param {any} value
   * @return {QueryBuilder}
   */
  public whereNot (field: string, value) {
    this.where(field, '!=', value)

    return this
  }

  /**
   * Adds a where in clause.
   *
   * @param {string} field
   * @param {any[]} values
   * @return {QueryBuilder}
   */
  public whereIn (field: string, values: any[]) {
    return this.buildWhereIn(field, values)
  }

  /**
   * Adds a where not in clause.
   *
   * @param {string} field
   * @param {any[]} values
   * @return {QueryBuilder}
   */
  public whereNotIn (field: string, values: any[]) {
    return this.buildWhereIn(field, values, true)
  }

  /**
   * Adds where between clause.
   *
   * @param {string} field
   * @param {any} min
   * @param {any} max
   * @return {QueryBuilder}
   */
  public whereBetween (field: string, min, max) {
    return this.buildWhereBetween(field, min, max)
  }

  /**
   * Adds where not between clause.
   *
   * @param {string} field
   * @param {any} min
   * @param {any} max
   * @return {QueryBuilder}
   */
  public whereNotBetween (field: string, min, max) {
    return this.buildWhereBetween(field, min, max, true)
  }

  /**
   * Adds where null clause.
   *
   * @param {string} field
   * @return {QueryBuilder}
   */
  public whereNull (field: string) {
    return this.buildWhereNull(field)
  }

  /**
   * Adds where not null clause.
   *
   * @param {string} field
   * @return {QueryBuilder}
   */
  public whereNotNull (field: string) {
    return this.buildWhereNull(field, true)
  }

  /**
   * Adds an offset.
   *
   * @param {integer} count
   * @return {QueryBuilder}
   */
  public offset (count: number) {
    if (!Number.isInteger(count)) {
      throw new TypeError('OFFSET allows only integers.')
    }

    this.offsets = `OFFSET ${count}`

    return this
  }

  /**
   * Adds a limit.
   *
   * @param {integer} count
   * @return {QueryBuilder}
   */
  public limit (count: number) {
    if (!Number.isInteger(count)) {
      throw new TypeError('LIMIT allows only integers.')
    }

    this.limits = `LIMIT ${count}`

    return this
  }

  /**
   * Adds an order by clause.
   *
   * @param {string} field
   * @param {string} direction
   * @return {QueryBuilder}
   */
  public orderBy (field: string, direction: string = 'ASC') {
    direction = direction.toUpperCase()

    this.orderBys.push(`\`${field}\` ${direction}`)

    return this
  }

  /**
   * Returns the first entry from the get statement.
   *
   * @param {string} fields
   * @return {Promise<any[]>}
   */
  public async first (fields: string = '*') {
    this.limit(1)

    return this.get(fields)
  }

  /**
   * Executes a count query.
   *
   * @param {string} field
   * @return {Promise<any[]|number>}
   */
  public async count (field: string = 'docType'): Promise<any[]|number> {
    return this.get(`count(\`${field}\`) as setteeCount`)
  }

  /**
   * Executes a query.
   *
   * @param {string} fields
   * @return {Promise<any[]|number>}
   */
  public async get (fields: string = '*'): Promise<any[]|number> {
    let { query, bindings } = this.prepare(fields)

    return new Promise<any[]|number>((resolve, reject) => {
      this.storage.executeQuery(query, bindings, this.options)
        .then((results: any) => {
          let entries = []

          results.forEach(result => {
            if (!result.docId && result.setteeCount) {
              return resolve(result.setteeCount)
            }

            let key = buildKey(this.docType, result.docId)

            entries.push(this.buildInstance(key, result))
          })

          resolve(entries)
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Paginates the results depending on the perPage count and page number.
   *
   * @param {number} perPage
   * @param {number} pageNumber
   * @param {string} fields
   * @return {Promise<{entries: null|Array<{}>, totalCount: number, perPage: number, pageNumber: number}>}
   */
  public async paginate (perPage: number = 15, pageNumber: number = 1, fields: string = '*') {
    try {
      const totalCount = await this.count()

      let offset = (pageNumber - 1) * perPage

      let entries = null

      if (totalCount > offset && pageNumber > 0) {
        entries = await this.offset(offset).limit(perPage).get(fields)
      }

      return { entries, totalCount, perPage, pageNumber }
    } catch (err) {
      throw new SetteeError('Unable to get the paginated results.')
    }
  }

  /**
   * Creates an index.
   *
   * @param {string} name
   * @param {string[]} fields
   * @param {boolean} scoped
   * @return {Promise<boolean>}
   */
  public async createIndex (name: string, fields: string[], scoped: boolean = true): Promise<boolean> {
    let query = `CREATE INDEX \`${name}\` ON \`${this.bucketName}\``
    query += ` (\`${fields.join(', ')}\`)`

    if (scoped) {
      query += ` WHERE \`docType\` = "${this.docType}"`
    }

    query += ' WITH {"defer_build":true}'

    return new Promise<boolean>((resolve, reject) => {
      this.storage.executeQuery(query, this.bindings, this.options)
        .then(() => resolve(true))
        .catch(err => reject(err))
    })
  }

  /**
   * Builds a query and bindings depending on the arguments from wheres, ordersBys, offsets and limits.
   *
   * @param {string} fields
   * @return {{query: string, bindings: any}}
   */
  public prepare (fields = '*'): { query: string, bindings: any } {
    if (Array.isArray(fields)) {
      fields = fields.join(', ')
    }

    let query = `SELECT ${fields} FROM \`${this.bucketName}\``

    query = this.appendWheres(query)
    query = this.appendOrderBys(query)
    query = this.appendOffset(query)
    query = this.appendLimit(query)

    return { query, bindings: this.bindings }
  }

  /**
   * Pushes a where statement to the query.
   *
   * @param {string} query
   * @return {string}
   */
  protected appendWheres (query: string): string {
    // ensure that we're properly scoped
    this.where('docType', this.docType)

    let where = 'WHERE ' + this.wheres.join(' AND ')

    query += ` ${where}`

    return query
  }

  /**
   * Pushes an order by statement to the query.
   *
   * @param {string} query
   * @return {string}
   */
  protected appendOrderBys (query: string): string {
    if (this.orderBys.length > 0) {
      query += ` ORDER BY ${this.orderBys.join(', ')}`
    }

    return query
  }

  /**
   * Pushes an offset statement to the query.
   *
   * @param {string} query
   * @return {string}
   */
  protected appendOffset (query: string): string {
    query += this.offsets ? ` ${this.offsets}` : ''

    return query
  }

  /**
   * Pushes a limit statement to the query.
   *
   * @param {string} query
   * @return {string}
   */
  protected appendLimit (query: string): string {
    query += this.limits ? ` ${this.limits}` : ''

    return query
  }

  /**
   * Resolves a proper binding name.
   *
   * @param {string} name
   * @return {string}
   */
  protected resolveBindingName (name: string) {
    return name.replace(/[._]/g, '')
  }

  /**
   * Builds the where object with where in statement.
   *
   * @param {string} field
   * @param {any} values
   * @param {boolean} isNegated
   * @return {QueryBuilder}
   */
  protected buildWhereIn (field: string, values, isNegated: boolean = false) {
    let bindingName = this.resolveBindingName(field)

    let operator = isNegated ? 'NOT IN' : 'IN'

    this.wheres.push(`\`${field}\` ${operator} $${bindingName}`)
    this.bindings[bindingName] = values

    return this
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
  protected buildWhereBetween (field: string, min, max, isNegated: boolean = false) {
    let bindingName = this.resolveBindingName(field)

    let operator = isNegated ? 'NOT BETWEEN' : 'BETWEEN'

    this.wheres.push(`\`${field}\` ${operator} $${bindingName}Min AND $${bindingName}Max`)

    this.bindings[bindingName + 'Min'] = min
    this.bindings[bindingName + 'Max'] = max

    return this
  }

  /**
   * Builds the where object with where null statement.
   *
   * @param {string} field
   * @param {boolean} isNegated
   * @return {QueryBuilder}
   */
  protected buildWhereNull (field: string, isNegated: boolean = false) {
    let operator = isNegated ? 'IS NOT NULL' : 'IS NULL'

    this.wheres.push(`\`${field}\` ${operator}`)

    return this
  }

  /**
   * Builds a new model instance.
   *
   * @param {string} key
   * @param {object} data
   * @param {CAS} cas
   * @return {Instance}
   */
  protected buildInstance (key: string, data: {}, cas: CAS = null) {
    if (!this.options.hasOwnProperty('model')) {
      throw new SetteeError('You cannot build model instance without the model provided via options.')
    }

    return new Instance(key, data, cas, this.options.model, {
      instanceMethods: this.options.instanceMethods
    })
  }
}

require('chai').use(require('chai-as-promised')).should()
import test from 'ava'
import td from 'testdouble'
import { connect } from '../../_bootstrap'

import { settee, Schema, Type } from '../../../.test/build'
import { SetteeError, StorageError } from '../../../.test/build/errors'

import QueryBuilder from '../../../.test/build/services/queryBuilder'
import Instance from '../../../.test/build/entities/instance'
import Model from '../../../.test/build/entities/model'
import Storage from '../../../.test/build/storage'

let queryBuilder, StubModel, StubStorage, CarSchema, Car

test.before.cb(t => {
  connect().then(bucket => {
    settee.useBucket(bucket)

    CarSchema = new Schema('Car', {
      brand: Type.string(),
      color: Type.string()
    })

    Car = settee.registerSchema(CarSchema)

    t.end()
  })
})

test.beforeEach(() => {
  StubStorage = td.object(Storage)

  td.when(StubStorage.getBucketName()).thenReturn('default')

  queryBuilder = new QueryBuilder(StubStorage, 'Foo')

  StubModel = td.object(Model)

  td.when(StubModel.getStorage()).thenReturn({})
})

test.after(() => {
  td.reset()
})

test('it requires the storage and document type init', () => {
  queryBuilder.bucketName.should.eq('default')
  queryBuilder.docType.should.eq('Foo')
})

test('it gets all entries of the type', async () => {
  const query = 'SELECT * FROM `default` WHERE `docType` = $docType'
  const bindings = { docType: 'Foo' }

  td.when(
    StubStorage.executeQuery(query, bindings, {})
  ).thenResolve([])

  await queryBuilder.all()
})

test('it returns all if no where clause is used', async () => {
  const query = 'SELECT * FROM `default` WHERE `docType` = $docType'
  const bindings = { docType: 'Foo' }

  td.when(
    StubStorage.executeQuery(query, bindings, {})
  ).thenResolve([])

  await queryBuilder.get()

  // force storage error
  td.when(
    StubStorage.executeQuery(
      td.matchers.anything(),
      td.matchers.anything(),
      td.matchers.anything()
    )
  ).thenReturn(Promise.reject(new StorageError('foo', 123)))

  await queryBuilder.get().should.be.rejectedWith(StorageError, /foo/)
})

test.serial('it populates model instances after query is resolved', async () => {
  let audi = await Car.create({ brand: 'Audi', color: 'red' })

  const qb = new QueryBuilder(CarSchema.getActiveStorage(), 'Car', {
    consistency: settee.consistency.REQUEST_PLUS,
    model: StubModel
  })

  let results = await qb.get()

  results.should.have.lengthOf(1)
  results[0].should.be.instanceOf(Instance)
  results[0].getKey().should.eq(audi.getKey())

  await audi.delete()
})

test.serial('it requires model to be passed in the options', async () => {
  let audi = await Car.create({ brand: 'Audi', color: 'red' })

  const qb = new QueryBuilder(CarSchema.getActiveStorage(), 'Car', {
    consistency: settee.consistency.REQUEST_PLUS
  })

  await qb.get().should.be.rejectedWith(SetteeError, /You cannot build model instance without the model provided via options/)

  await audi.delete()
})

test('it allows specified fields in a get method', async () => {
  const query = 'SELECT color, qty AS quantity FROM `default` WHERE `docType` = $docType'
  const bindings = { docType: 'Foo' }

  td.when(
    StubStorage.executeQuery(query, bindings, {})
  ).thenResolve([])

  await queryBuilder.get(['color', 'qty AS quantity'])
})

test('it supports simple where equals clause (2 args)', () => {
  queryBuilder.where('color', 'yellow').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `color` = $color AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        color: 'yellow'
      }
    })
})

test('it supports custom where clause (3 args)', () => {
  queryBuilder.where('color', '!=', 'yellow').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `color` != $color AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        color: 'yellow'
      }
    })
})

test('it throws an error if invalid operator is used in where clause', t => {
  t.throws(() => {
    queryBuilder.where('color', '!===', 'yellow')
  }, Error, /Invalid operator '!==='/)
})

test('it supports where like clause', () => {
  queryBuilder.where('color', 'LIKE', 'yellow').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `color` LIKE $color AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        color: 'yellow'
      }
    })
})

test('it supports where not like clause', () => {
  queryBuilder.where('color', 'NOT LIKE', 'yellow').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `color` NOT LIKE $color AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        color: 'yellow'
      }
    })
})

test('it supports where not equal clause', () => {
  queryBuilder.whereNot('color', 'yellow').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `color` != $color AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        color: 'yellow'
      }
    })
})

test('it supports where less than clause', () => {
  queryBuilder.where('amount', '<', 5).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` < $amount AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        amount: 5
      }
    })
})

test('it supports where less than equal clause', () => {
  queryBuilder.where('amount', '<=', 5).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` <= $amount AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        amount: 5
      }
    })
})

test('it supports where greater than clause', () => {
  queryBuilder.where('amount', '>', 5).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` > $amount AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        amount: 5
      }
    })
})

test('it supports where greater than equal clause', () => {
  queryBuilder.where('amount', '>=', 5).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` >= $amount AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        amount: 5
      }
    })
})

test('it supports where in clause', () => {
  queryBuilder.whereIn('color', ['yellow', 'red']).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `color` IN $color AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        color: ['yellow', 'red']
      }
    })
})

test('it supports not where in clause', () => {
  queryBuilder.whereNotIn('color', ['yellow', 'red']).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `color` NOT IN $color AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        color: ['yellow', 'red']
      }
    })
})

test('it supports where between clause', () => {
  queryBuilder.whereBetween('amount', 1, 5).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` BETWEEN $amountMin AND $amountMax AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        amountMin: 1,
        amountMax: 5
      }
    })
})

test('it supports where not between clause', () => {
  queryBuilder.whereNotBetween('amount', 1, 5).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` NOT BETWEEN $amountMin AND $amountMax AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        amountMin: 1,
        amountMax: 5
      }
    })
})

test('it supports where null clause', () => {
  queryBuilder.whereNull('amount').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` IS NULL AND `docType` = $docType',
      bindings: {
        docType: 'Foo'
      }
    })
})

test('it supports where not null clause', () => {
  queryBuilder.whereNotNull('amount').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` IS NOT NULL AND `docType` = $docType',
      bindings: {
        docType: 'Foo'
      }
    })
})

test('it supports limit clause', () => {
  queryBuilder.whereNotNull('amount').limit(1).prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `amount` IS NOT NULL AND `docType` = $docType LIMIT 1',
      bindings: {
        docType: 'Foo'
      }
    })
})

test('it aliases first to the limit 1 clause', async () => {
  const query = 'SELECT * FROM `default` WHERE `amount` IS NOT NULL AND `docType` = $docType LIMIT 1'
  const bindings = { docType: 'Foo' }

  td.when(
    StubStorage.executeQuery(query, bindings, {})
  ).thenResolve([])

  await queryBuilder.whereNotNull('amount').first()
})

test('it only allows integers in limit clause', t => {
  t.throws(() => {
    queryBuilder.whereNotNull('amount').limit('invalid')
  }, Error, /LIMIT allows only integers./)
})

test('it only allows integers in offset clause', t => {
  t.throws(() => {
    queryBuilder.whereNotNull('amount').offset('invalid')
  }, Error, /OFFSET allows only integers./)
})

test('it combines multiple wheres', () => {
  queryBuilder.whereNotNull('amount')
    .where('color', '!=', 'red')
    .prepare('color')
    .should.deep.eq({
      query: 'SELECT color FROM `default` WHERE `amount` IS NOT NULL AND `color` != $color AND `docType` = $docType',
      bindings: {
        docType: 'Foo',
        color: 'red'
      }
    })
})

test('it orders the results in ascending order by default', () => {
  queryBuilder.orderBy('name').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `docType` = $docType ORDER BY `name` ASC',
      bindings: {
        docType: 'Foo'
      }
    })
})

test('it orders the result in ascending order', () => {
  queryBuilder.orderBy('name', 'asc').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `docType` = $docType ORDER BY `name` ASC',
      bindings: {
        docType: 'Foo'
      }
    })
})

test('it orders the result in descending order', () => {
  queryBuilder.orderBy('name', 'desc').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `docType` = $docType ORDER BY `name` DESC',
      bindings: {
        docType: 'Foo'
      }
    })
})

test('it supports multiple order by clauses', () => {
  queryBuilder.orderBy('name', 'desc').orderBy('color').prepare()
    .should.deep.eq({
      query: 'SELECT * FROM `default` WHERE `docType` = $docType ORDER BY `name` DESC, `color` ASC',
      bindings: {
        docType: 'Foo'
      }
    })
})

test('it supports count queries', async () => {
  const query = 'SELECT count(`docType`) as setteeCount FROM `default` WHERE `docType` = $docType'
  const bindings = { docType: 'Foo' }

  td.when(
    StubStorage.executeQuery(query, bindings, {})
  ).thenResolve([])

  await queryBuilder.count()
})

test.serial('it provides count of the entries', async () => {
  let audi = await Car.create({ brand: 'Audi', color: 'red' })
  let bmw = await Car.create({ brand: 'BMW', color: 'blue' })
  let honda = await Car.create({ brand: 'Honda', color: 'pink' })

  const qb = new QueryBuilder(CarSchema.getActiveStorage(), 'Car', {
    consistency: settee.consistency.REQUEST_PLUS
  })

  await qb.count().should.eventually.eq(3)

  await audi.delete()
  await bmw.delete()
  await honda.delete()
})

test('it supports pagination', async () => {
  const countQuery = 'SELECT count(`docType`) as setteeCount FROM `default` WHERE `docType` = $docType'
  const mainQuery = 'SELECT * FROM `default` WHERE `docType` = $docType OFFSET 0 LIMIT 15'
  const bindings = { docType: 'Foo' }

  td.when(
    StubStorage.executeQuery(countQuery, bindings, {})
  ).thenResolve([])

  td.when(
    StubStorage.executeQuery(mainQuery, bindings, {})
  ).thenResolve([])

  await queryBuilder.paginate()

  // error
  td.when(
    StubStorage.executeQuery(countQuery, bindings, {})
  ).thenReject(new Error('error'))

  await queryBuilder.paginate()
    .should.be.rejectedWith(SetteeError, /Unable to get the paginated results/)
})

test('it supports custom count per page in pagination', async () => {
  const countQuery = 'SELECT count(`docType`) as setteeCount FROM `default` WHERE `docType` = $docType'
  const mainQuery = 'SELECT * FROM `default` WHERE `docType` = $docType OFFSET 0 LIMIT 10'
  const bindings = { docType: 'Foo' }

  td.when(
    StubStorage.executeQuery(countQuery, bindings, {})
  ).thenResolve([])

  td.when(
    StubStorage.executeQuery(mainQuery, bindings, {})
  ).thenResolve([])

  await queryBuilder.paginate(10)
})

test('it supports direct access to a page in pagination', async () => {
  const countQuery = 'SELECT count(`docType`) as setteeCount FROM `default` WHERE `docType` = $docType'
  const mainQuery = 'SELECT * FROM `default` WHERE `docType` = $docType OFFSET 10 LIMIT 10'
  const bindings = { docType: 'Foo' }

  td.when(
    StubStorage.executeQuery(countQuery, bindings, {})
  ).thenResolve([])

  td.when(
    StubStorage.executeQuery(mainQuery, bindings, {})
  ).thenResolve([])

  await queryBuilder.paginate(10, 2)
})

test.serial('it provides paginated results', async () => {
  let audi = await Car.create({ brand: 'Audi', color: 'red' })
  let bmw = await Car.create({ brand: 'BMW', color: 'blue' })
  let honda = await Car.create({ brand: 'Honda', color: 'pink' })

  const qb = new QueryBuilder(CarSchema.getActiveStorage(), 'Car', {
    consistency: settee.consistency.REQUEST_PLUS,
    model: StubModel
  })

  let cars = await qb.paginate(2)

  cars.entries.should.have.lengthOf(2)
  cars.totalCount.should.eq(3)
  cars.perPage.should.eq(2)
  cars.pageNumber.should.eq(1)

  await audi.delete()
  await bmw.delete()
  await honda.delete()
})

test('it supports creating GSI index query', async () => {
  let query = 'CREATE INDEX `Bike#findByColor` ON `default` (`color`) WITH {"defer_build":true}'
  const bindings = {}

  td.when(
    StubStorage.executeQuery(query, bindings, {})
  ).thenResolve([])

  await queryBuilder.createIndex('Bike#findByColor', ['color'], false)
})

test('it supports create scoped GSI index query', async () => {
  const query = 'CREATE INDEX `Bike#findByColorAndBrand` ON `default` (`color, brand`) WHERE `docType` = "Foo" WITH {"defer_build":true}'
  const bindings = {}

  td.when(
    StubStorage.executeQuery(query, bindings, {})
  ).thenResolve([])

  await queryBuilder.createIndex('Bike#findByColorAndBrand', ['color', 'brand'])
})

test('it throws error if index creation fails', async () => {
  // error case
  let query = 'CREATE INDEX `Bike#findByColor` ON `default` (`color, color`) WITH {"defer_build":true}'
  const bindings = {}

  td.when(
    StubStorage.executeQuery(query, bindings, {})
  ).thenReturn(Promise.reject(new StorageError('error', 123)))

  queryBuilder.createIndex('Bike#findByColor', ['color', 'color'], false)
    .should.be.rejectedWith(StorageError)
})

require('chai').use(require('chai-as-promised')).should()
import test from 'ava'
import { connect } from '../_bootstrap'

import { v4 as uuid } from 'uuid'
import { N1qlQuery } from 'couchbase'
import { settee } from '../../.test/build/index'
import Storage from '../../.test/build/storage'
import { StorageError } from '../../.test/build/errors'

let storage, options

test.before.cb(t => {
  connect()
    .then(bucket => {
      storage = new Storage(bucket)

      options = {
        consistency: settee.consistency.REQUEST_PLUS
      }

      t.end()
    })
})

test.beforeEach(t => {
  t.context.data = {
    key: uuid(),
    key2: uuid()
  }
})

test.after(() => {
  storage.disconnect()
})

test('it provides a bucket manager instance', () => {
  storage.getManager().should.be.instanceOf(Object)
})

test('it provides a bucket name', () => {
  storage.getBucketName().should.eq('testing')
})

test('it inserts a new entry', async t => {
  const result = await storage.insert(t.context.data.key, { brand: 'Audi' }, options)

  result.cas.should.be.instanceOf(Object)

  await storage.remove(t.context.data.key)
})

test('it removes an entry', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' })

  const result = await storage.remove(t.context.data.key, options)

  result.cas.should.be.instanceOf(Object)
})

test('it gets an entry by key', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  const result = await storage.get(t.context.data.key, options)

  result.value.brand.should.eq('Audi')

  await storage.remove(t.context.data.key)
})

test.serial('it gets entries by multiple keys', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)
  await storage.upsert(t.context.data.key2, { brand: 'BMW' }, options)

  const results = await storage.getMulti([t.context.data.key, t.context.data.key2])

  results[t.context.data.key].value.brand.should.eq('Audi')
  results[t.context.data.key2].value.brand.should.eq('BMW')

  await storage.remove(t.context.data.key)
  await storage.remove(t.context.data.key2)
})

test('it gets an entry by key and updates expiration of the entry', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  const result = await storage.getAndTouch(t.context.data.key, 10)

  await storage.remove(t.context.data.key)

  result.value.brand.should.eq('Audi')
})

test('it unlocks the entry', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  const result = await storage.getAndLock(t.context.data.key)

  await storage.unlock(t.context.data.key, result.cas)

  await storage.remove(t.context.data.key)
})

test('it gets an entry key and locks the entry', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  const result = await storage.getAndLock(t.context.data.key)

  result.value.brand.should.eq('Audi')

  // document is locked
  await storage.remove(t.context.data.key, options)
    .should.be.rejectedWith(StorageError)

  await storage.unlock(t.context.data.key, result.cas, options)

  await storage.remove(t.context.data.key)
})

test('it appends a string to a string only entry', async t => {
  await storage.upsert(t.context.data.key, 'Audi', options)

  await storage.append(t.context.data.key, ' & BMW')

  const result = await storage.get(t.context.data.key)

  result.value.should.eq('Audi & BMW')

  await storage.remove(t.context.data.key)
})

test('it prepends a string to a string only entry', async t => {
  await storage.upsert(t.context.data.key, 'Audi', options)

  await storage.prepend(t.context.data.key, 'BMW & ')

  const result = await storage.get(t.context.data.key)

  result.value.should.eq('BMW & Audi')

  await storage.remove(t.context.data.key)
})

test('it adds a number to a number only entry', async t => {
  await storage.upsert(t.context.data.key, 1, options)

  await storage.counter(t.context.data.key)

  let result = await storage.get(t.context.data.key)
  result.value.should.eq(2)

  await storage.counter(t.context.data.key, 5)

  result = await storage.get(t.context.data.key)
  result.value.should.eq(7)

  await storage.counter(t.context.data.key, -3, options)

  result = await storage.get(t.context.data.key)
  result.value.should.eq(4)

  await storage.remove(t.context.data.key)
})

test('it replaces the entry', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  await storage.replace(t.context.data.key, { brand: 'BMW' })

  const result = await storage.get(t.context.data.key)

  result.value.brand.should.eq('BMW')

  await storage.remove(t.context.data.key)
})

test('it replaces or creates the entry', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' })

  const result = await storage.get(t.context.data.key, options)

  result.value.brand.should.eq('Audi')

  await storage.remove(t.context.data.key)
})

test('it sets the expiration on the entry', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  await storage.touch(t.context.data.key, 1)

  // wait for the entry to be deleted atomatically
  await new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, 2500)
  })

  await storage.get(t.context.data.key, options)
    .should.be.rejectedWith(StorageError)
})

test('it checks if the entry exists', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  await storage.exists(t.context.data.key).should.eventually.be.true
  await storage.exists('not-present').should.eventually.be.false

  await storage.remove(t.context.data.key, options)
})

test.serial('it executes a N1QL query and provides a raw result', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  let query = N1qlQuery.fromString('SELECT * FROM `testing`')

  query.consistency(options.consistency)

  const result = await storage.query(query)

  await storage.remove(t.context.data.key, options)

  result[0].testing.brand.should.eq('Audi')

  // error
  query = N1qlQuery.fromString('SELECT * FROM `invalid`')
  await storage.query(query)
    .should.be.rejectedWith(StorageError)
})

test.serial('it executes a string N1QL query and provides a transformed result', async t => {
  await storage.upsert(t.context.data.key, { brand: 'Audi' }, options)

  const query = 'SELECT * FROM `testing`'

  const result = await storage.executeQuery(query, {}, options)

  await storage.remove(t.context.data.key)

  result[0].brand.should.eq('Audi')

  // error
  const originalQuery = storage.query
  storage.query = (query, options) => Promise.reject(new Error('error'))

  await storage.executeQuery(query)
    .should.be.rejectedWith(StorageError)

  storage.query = originalQuery
})

test.serial('it creates an index', async () => {
  await storage.createIndex('findByAmount', ['amount'])
    .should.eventually.be.true

  // error
  await storage.createIndex('findByAmount')
    .should.be.rejectedWith(StorageError)

  await storage.dropIndex('findByAmount')
})

test.serial('it drops an index', async () => {
  await storage.createIndex('findByCustomer', ['customer'])

  await storage.dropIndex('findByCustomer')
    .should.eventually.be.true

  // error
  await storage.dropIndex('missing-index')
    .should.be.rejectedWith(StorageError)
})

test.serial('it provides the list of indexes', async () => {
  await storage.createIndex('findByEmail', ['email'])

  const indexes = await storage.getIndexes(options)

  indexes.find(index => {
    return index.name === 'findByEmail'
  }).should.not.be.undefined

  await storage.dropIndex('findByEmail')

  // error
  const originalQuery = storage.query
  storage.query = (query, options) => Promise.reject(new Error('error'))

  await storage.getIndexes()
    .should.be.rejectedWith(StorageError)

  storage.query = originalQuery
})

test.serial('it builds deferred indexes', async () => {
  await storage.createIndex('findByPower', ['power'], {
    deferred: true
  })

  let indexes = await storage.getIndexes(options)
  let index = indexes.find(index => {
    return index.name === 'findByPower'
  })

  index.state.should.eq('deferred')

  await storage.buildDeferredIndexes()
    .should.eventually.be.true

  indexes = (await storage.getIndexes(options))
  index = indexes.find(index => {
    return setTimeout(() => {
      return index.name === 'findByPower'
    }, 5000)
  })

  index.state.should.eq('online')

  await storage.dropIndex('findByPower')

  // error
  const originalGetIndexes = storage.getIndexes
  storage.getIndexes = () => Promise.reject(new Error('error'))

  await storage.buildDeferredIndexes()
    .should.be.rejectedWith(StorageError)

  storage.getIndexes = originalGetIndexes
})

test.serial('it returns true if no indexes require building', async () => {
  await storage.buildDeferredIndexes()
    .should.eventually.be.true
})

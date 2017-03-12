import test from 'ava'
require('chai').use(require('chai-as-promised')).should()
import { connect } from '../../_bootstrap'
import td from 'testdouble'

const Joi = require('joi')
import { settee, Schema, Type } from '../../../.test/build'
import Storage from '../../../.test/build/storage'
import Validator from '../../../.test/build/services/validator'
import { StorageError } from '../../../.test/build/errors'

let layout, storage, schema

test.beforeEach.cb(t => {
  connect()
    .then(bucket => {
      settee.useBucket(bucket)
      layout = { brand: Type.string() }
      storage = td.object(Storage)

      schema = new Schema('Car', layout)

      t.end()
    })
})

test.afterEach(() => {
  td.reset()
})

test('it adds docId and docType to schema layout by default', () => {
  Joi.reach(schema.layout, 'docId').should.not.be.undefined
  Joi.reach(schema.layout, 'docType').should.not.be.undefined
})

test('it sets and provides the storage', () => {
  schema.useStorage({})

  schema.getActiveStorage().should.deep.eq({})
})

test('it provides a validator instance', () => {
  schema.getValidator().should.be.instanceOf(Validator)
})

test('it adds indexes to the list', () => {
  schema.addIndexes({
    findByBrand: { by: 'brand' }
  })

  schema.indexes.findByBrand.by.should.be.eq('brand')
})

test('it checks presence of the index tied to the schema', async () => {
  storage.getIndexes = options => Promise.resolve([
    { name: 'findByBrand', using: 'gsi' }
  ])

  schema.useStorage(storage)

  schema.seeIndex('findByBrand')
    .should.eventually.be.true
})

test('it throws error if the index is not present', async () => {
  storage.getIndexes = options => Promise.reject(new StorageError('error', 123))

  schema.useStorage(storage)

  schema.seeIndex('findByBrand')
    .should.eventually.be.rejectedWith(StorageError)
})

test('it drops index tied to the schema', () => {
  storage.dropIndex = (name, options) => Promise.resolve(true)

  schema.useStorage(storage)

  schema.dropIndex('findByBrand')
    .should.eventually.be.true
})

test('it throws error if the index cannot be dropped', async () => {
  storage.dropIndex = (name, options) => Promise.reject(new StorageError('error', 123))

  schema.useStorage(storage)

  schema.dropIndex('findByBrand')
    .should.eventually.be.rejectedWith(StorageError)
})

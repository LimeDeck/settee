require('chai').use(require('chai-as-promised')).should()
import test from 'ava'
import td from 'testdouble'

import { SetteeError } from '../../../.test/build/errors'
import Storage from '../../../.test/build/storage'
import Indexer from '../../../.test/build/indexes/indexer'
import QueryBuilder from '../../../.test/build/services/queryBuilder'

let schema, storage, queryBuilder, indexer

test.beforeEach(() => {
  schema = {
    name: 'Car',
    indexes: {
      findByColor: {
        by: 'color'
      },
      findByColorAndBrand: {
        by: ['color', 'brand']
      }
    }
  }

  queryBuilder = td.object(QueryBuilder)

  storage = td.object(Storage)
  storage.buildDeferredIndexes = () => {
    return new Promise(resolve => resolve(true))
  }

  indexer = new Indexer(storage)
  indexer.newQuery = (schemaName) => queryBuilder
})

test.afterEach(() => {
  td.reset()
})

test('it adds Settee#docType index by default', () => {
  indexer.addIndexes(schema)

  indexer.indexes.has('Settee#docType').should.be.true

  let index = indexer.indexes.get('Settee#docType')
  index.schemaName.should.eq('Car')
  index.indexName.should.eq('findByDocType')
  index.index.by.should.eq('docType')
})

test('it assigns indexes provided by the schema', () => {
  indexer.addIndexes(schema)

  indexer.indexes.size.should.eq(3)
  indexer.indexes.has('Settee#docType').should.be.true
  indexer.indexes.has('Car#findByColor').should.be.true
  indexer.indexes.has('Car#findByColorAndBrand').should.be.true
})

test('throws error if schema provides invalid index format', t => {
  const failingSchema = {
    name: 'Bar',
    indexes: {
      findByBar: {}
    }
  }

  const err = t.throws(() => {
    indexer.addIndexes(failingSchema)
  }, SetteeError)

  err.message.should.contain(`Index 'findByBar' has invalid format`)
})

test('it registers and builds indexes', async () => {
  td.when(queryBuilder.createIndex(
    td.matchers.anything(), td.matchers.anything())
  ).thenResolve(true)

  indexer.addIndexes(schema)

  indexer.registerIndexes().should.eventually.be.true
})

test('it ignores already existing indexes', () => {
  td.when(queryBuilder.createIndex(
    td.matchers.anything(), td.matchers.anything())
  ).thenReject(new Error('... index already exists'))

  indexer.addIndexes(schema)

  indexer.registerIndexes().should.eventually.be.true
})

test('it fails to register the indexes if an error occurs', () => {
  td.when(queryBuilder.createIndex(
    td.matchers.anything(), td.matchers.anything())
  ).thenReject(new Error())

  indexer.addIndexes(schema)

  indexer.registerIndexes()
    .should.be.rejectedWith(SetteeError, /Unable to register the indexes/)
})

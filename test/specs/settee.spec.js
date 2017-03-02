require('chai').use(require('chai-as-promised')).should()
import test from 'ava'
import { connect } from '../_bootstrap'

import Storage from '../../.test/build/storage'
import Indexer from '../../.test/build/indexes/indexer'
import Model from '../../.test/build/entities/model'
import { Schema, Type } from '../../.test/build/index'
import { Settee } from '../../.test/build/settee'
import { SetteeError } from '../../.test/build/errors'

let bucket, settee

test.beforeEach.cb(t => {
  connect()
    .then(bucketInstance => {
      bucket = bucketInstance

      t.end()
    })
})

test.beforeEach(() => {
  settee = new Settee()
})

test('it sets an active bucket and creates storage with indexer', t => {
  settee.useBucket(bucket)

  settee.getBucket().should.not.be.undefined
  settee.getStorage().should.be.instanceOf(Storage)
  settee.indexer.should.be.instanceOf(Indexer)

  // error
  const err = t.throws(() => {
    settee.useBucket('invalid-bucket')
  }, SetteeError)

  err.message.should.contain('is not a proper Bucket')
})

test.cb('it registers a schema', t => {
  t.plan(3)

  settee.useBucket(bucket)

  // mock the dependencies
  settee.indexer.addIndexes = (schema) => {
    t.pass()
  }

  settee.registeredSchemas.add = (schema, model) => {
    t.pass()
  }

  const CarSchema = new Schema('Car', {
    brand: Type.string()
  })

  settee.registerSchema(CarSchema)
    .should.be.instanceOf(Model)

  // errors
  settee.storage = null
  const err = t.throws(() => {
    settee.registerSchema(CarSchema)
  }, SetteeError)

  err.message.should.contain('before registering a schema')

  t.end()
})

test('it builds deferred indexes', async () => {
  settee.useBucket(bucket)

  // mock the dependencies
  settee.indexer.registerIndexes = () => Promise.resolve(true)

  await settee.buildIndexes()
    .should.eventually.be.true
})

test('it terminates the connection to the bucket', async t => {
  settee.useBucket(bucket)

  await settee.disconnect()

  t.is(settee.getBucket(), null)
  t.is(settee.getStorage(), null)

  // errors
  await settee.disconnect()
    .should.be.rejectedWith(SetteeError, /Unable to disconnect/)
})

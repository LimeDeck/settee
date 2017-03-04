require('chai').use(require('chai-as-promised')).should()
import test from 'ava'
import { connect, testingConfig } from '../_bootstrap'

import Storage from '../../.test/build/storage'
import Indexer from '../../.test/build/indexes/indexer'
import Model from '../../.test/build/entities/model'
import Settee from '../../.test/build/settee'
import { Schema, Type } from '../../.test/build/index'
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

test('it connects to the cluster and sets the active bucket', async t => {
  await settee.connect(testingConfig.cluster, testingConfig.bucket)

  settee.getBucket().should.not.be.undefined
  settee.getStorage().should.be.instanceOf(Storage)
  settee.indexer.should.be.instanceOf(Indexer)

  // error
  await settee.connect(testingConfig.cluster, 'invalid-bucket')
    .should.be.rejectedWith(SetteeError, /could not be established/)
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
  t.plan(2)

  settee.useBucket(bucket)

  // mock the dependencies
  settee.indexer.addIndexes = (schema) => {
    t.pass()
  }

  const CarSchema = new Schema('Car', {
    brand: Type.string()
  })

  settee.buildModel(CarSchema)
    .should.be.instanceOf(Model)

  // errors
  settee.storage = null
  const err = t.throws(() => {
    settee.buildModel(CarSchema)
  }, SetteeError)

  err.message.should.contain('before building a model')

  t.end()
})

test('it registers a set of models', t => {
  settee.useBucket(bucket)

  const CarSchema = new Schema('Car', {
    brand: Type.string()
  })

  const Car = settee.buildModel(CarSchema)

  const EngineSchema = new Schema('Engine', {
    brand: Type.number(150)
  })

  const Engine = settee.buildModel(EngineSchema)

  settee.registerModels([
    Car, Engine
  ])

  settee.getModel('Car')
    .should.deep.eq(Car)

  settee.getModel('Engine')
    .should.deep.eq(Engine)

  // error
  const err = t.throws(() => {
    settee.getModel('Missing')
  }, SetteeError)

  err.message.should.contain(`Model 'Missing' is not available.`)
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

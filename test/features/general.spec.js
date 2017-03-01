require('chai').use(require('chai-as-promised')).should()
import test from 'ava'
import { connect } from '../_bootstrap'

import { settee, Schema, Type } from '../../.test/build'

test.before.cb(t => {
  connect()
    .then(bucket => {
      settee.useBucket(bucket)
      t.end()
    })
})

test.after(async () => {
  await settee.disconnect()
})

test.serial('common workflow without indexes and custom model or instance methods', async () => {
  // We're in the market for a new car ...
  const CarSchema = new Schema('Car', {
    brand: Type.string(),
    color: Type.string()
  })

  // ... after the connection has been established ...
  const Car = settee.registerSchema(CarSchema)

  // ... we buy a red Audi
  let audi = await Car.create({
    brand: 'Audi',
    color: 'red'
  })

  audi.getKey().should.not.be.null
  audi.getId().should.not.be.null
  audi.getCas().should.not.be.null
  audi.getType().should.eq('Car')
  audi.brand.should.eq('Audi')
  audi.color.should.eq('red')

  // .. later we respray the car ...
  audi.color = 'blue'

  // nothing to do with the new shiny color,
  // rather it states that the instance has been modified
  audi.isDirty().should.be.true

  // ... and we park the car in the garage.
  await audi.save()

  // After a while we take it out again ...
  audi = await Car.findById(audi.getId())

  // ... enjoy the blue color for a while ...
  audi.color.should.eq('blue')

  // ... and we destroy it
  await audi.delete().should.eventually.be.true
})

test.serial('common workflow with indexes', async () => {
  // We're in the market for a new car ...
  const CarSchema = new Schema('Car', {
    brand: Type.string(),
    color: Type.string()
  })

  CarSchema.addIndexes({
    findByBrand: { by: 'brand' }
  })

  // ... after the connection has been established ...
  const Car = settee.registerSchema(CarSchema)

  // ... we ensure that the indexes are ready ...
  await settee.buildIndexes()

  // ... we buy a red Audi ...
  let audi = await Car.create({
    brand: 'Audi',
    color: 'red'
  })

  // ... and see that it is properly indexed
  const indexes = await Car.getStorage().getIndexes({
    consistency: settee.consistency.REQUEST_PLUS
  })

  indexes.find(index => {
    return index.name === 'Car#findByBrand'
  }).should.not.be.undefined

  // After a while we quickly take it out from the garage ...
  audi = await Car.findById(audi.getId())

  // ... enjoy the original red color for a while ...
  audi.color.should.eq('red')

  // ... and we destroy it
  await audi.delete().should.eventually.be.true

  await Car.getStorage().dropIndex('Car#findByBrand')
  await Car.getStorage().dropIndex('Settee#docType')
})

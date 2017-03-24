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
  const Car = settee.buildModel(CarSchema)

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
  const Car = settee.buildModel(CarSchema)

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

test.serial('common queries', async () => {
  // We're in the market for a new car ...
  const CarSchema = new Schema('Car', {
    brand: Type.string(),
    color: Type.string()
  })

  const Car = settee.buildModel(CarSchema)

  let bmw = Car.create({
    brand: 'BMW',
    color: 'blue'
  })

  let audi = await Car.create({
    brand: 'Audi',
    color: 'red'
  })

  // query builder is scoped to 'Car' docType
  let queryBuilder = Car.q({
    consistency: settee.consistency.REQUEST_PLUS
  })

  // get all cars
  await queryBuilder.all()
    .should.eventually.have.lengthOf(2)

  // get the count of all cars
  await queryBuilder.count()
    .should.eventually.eq(2)

  // let's get a BMW with the first() method
  let retrievedBmw = await queryBuilder.where('brand', 'BMW').first()

  retrievedBmw.brand.should.eq('BMW')
  retrievedBmw.color.should.eq('blue')

  // let's delete the entry
  await retrievedBmw.delete()
  await audi.delete()
})

test.serial('simple access to models', () => {
  const CarSchema = new Schema('Car', {
    brand: Type.string(),
    color: Type.string()
  })

  const Car = settee.buildModel(CarSchema)

  // We register the models with settee ...
  settee.registerModels([Car])

  // ... and we can easily access them across different files.
  const resolvedCar = settee.getModel('Car')

  // It's the same model ...
  resolvedCar.should.deep.eq(Car)
})

test.serial('workflow with referenced models', async () => {
  // Create our Engine Schema first.
  const EngineSchema = new Schema('Engine', {
    make: Type.string(),
    power: Type.number()
  })

  const Engine = settee.buildModel(EngineSchema)

  const WheelSchema = new Schema('Wheel', {
    brand: Type.string()
  })

  const Wheel = settee.buildModel(WheelSchema)

  // we define the Engine as Type.reference(Engine) and an array of wheels
  const CarSchema = new Schema('Car', {
    brand: Type.string(),
    topSpeed: Type.number(),
    taxPaid: Type.boolean(),
    engine: Type.reference(Engine),
    wheels: Type.array(Type.object({
      wheelType: Type.reference(Wheel)
    }))
  })

  const Car = settee.buildModel(CarSchema)

  settee.registerModels([Car, Engine, Wheel])

  let engine = await Engine.create({
    power: 150,
    make: 'Bayerische Motoren Werke AG'
  })

  let michelinWheel = await Wheel.create({
    brand: 'Michelin'
  })

  let bridgestoneWheel = await Wheel.create({
    brand: 'Bridgestone'
  })

  let bmw = await Car.create({
    brand: 'BMW',
    engine: engine,
    wheels: [
      { wheelType: michelinWheel },
      { wheelType: michelinWheel },
      { wheelType: bridgestoneWheel },
      { wheelType: bridgestoneWheel }
    ]
  })

  // you can now access the engine and wheels directly
  bmw.brand.should.eq('BMW')
  bmw.engine.power.should.eq(150)
  bmw.engine.make.should.eq('Bayerische Motoren Werke AG')
  bmw.wheels.should.have.lengthOf(4)
  bmw.wheels[0].wheelType.brand.should.eq('Michelin')
  bmw.wheels[1].wheelType.brand.should.eq('Michelin')
  bmw.wheels[2].wheelType.brand.should.eq('Bridgestone')
  bmw.wheels[3].wheelType.brand.should.eq('Bridgestone')

  // and you can also update the engine individually
  bmw.engine.power = 200

  await bmw.engine.save()

  let resolvedEngine = await Engine.findById(bmw.engine.getId())

  resolvedEngine.power.should.eq(200)

  await bmw.delete()
})

test.serial('it can save referenced arrays when editing an entry', async () => {
  const WheelSchema = new Schema('Wheel', {
    brand: Type.string()
  })

  const Wheel = settee.buildModel(WheelSchema)

  const CarSchema = new Schema('Car', {
    brand: Type.string(),
    topSpeed: Type.number(),
    taxPaid: Type.boolean(),
    wheels: Type.array(Type.object({
      wheelType: Type.reference(Wheel)
    }))
  })

  const Car = settee.buildModel(CarSchema)

  settee.registerModels([Car, Wheel])

  let michelinWheel = await Wheel.create({
    brand: 'Michelin'
  })

  let bridgestoneWheel = await Wheel.create({
    brand: 'Bridgestone'
  })

  let bmw = await Car.create({
    brand: 'BMW'
  })

  bmw.wheels = [
    { wheelType: michelinWheel },
    { wheelType: bridgestoneWheel }
  ]

  await bmw.save()

  bmw.brand.should.eq('BMW')
  bmw.wheels.should.have.lengthOf(2)

  await bmw.delete()
})

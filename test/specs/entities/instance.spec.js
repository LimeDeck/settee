require('chai').use(require('chai-as-promised')).should()
import test from 'ava'
import td from 'testdouble'
import { connect } from '../../_bootstrap'

import { settee, Schema, Type } from '../../../.test/build'
import { StorageError } from '../../../.test/build/errors'
import Storage from '../../../.test/build/storage'
import Instance from '../../../.test/build/entities/instance'

let Car, Engine, Wheel, StubStorage

test.beforeEach.cb(t => {
  connect()
    .then(bucket => {
      settee.useBucket(bucket)

      const EngineSchema = new Schema('Engine', {
        power: Type.integer(100)
      })

      Engine = settee.buildModel(EngineSchema)

      const WheelSchema = new Schema('Wheel', {
        brand: Type.string()
      })

      Wheel = settee.buildModel(WheelSchema)

      const CarSchema = new Schema('Car', {
        brand: Type.string(),
        color: Type.string(),
        taxPaid: Type.boolean(false),
        engine: Type.reference(Engine),
        wheels: Type.array(Type.object({
          wheelType: Type.reference(Wheel)
        })),
        transmission: {
          brand: Type.string(),
          gearsCount: Type.integer()
        }
      })

      Car = settee.buildModel(CarSchema)

      settee.registerModels([Car, Engine])

      StubStorage = td.object(Storage)
      Car.storage = StubStorage
      Engine.storage = Object.assign({}, StubStorage)

      Car.storage.insert = (key, data) => {
        return Promise.resolve({ cas: 'cas' })
      }

      t.end()
    })
})

test.afterEach(() => {
  td.reset()
})

test('it provides id of the loaded resource', () => {
  let instance = new Instance('Car::123', {
    docId: '123'
  }, null, Car)

  instance.getId().should.eq('123')
})

test('it provides key of the loaded resource', () => {
  let instance = new Instance('Car::123', {
    docId: '123'
  }, null, Car)

  instance.getKey().should.eq('Car::123')
})

test('it provides type of the loaded resource', () => {
  let instance = new Instance('Car::123', {
    docType: 'Car'
  }, null, Car)

  instance.getType().should.eq('Car')
})

test('it provides CAS of the loaded resource', () => {
  let instance = new Instance('Car::123', {}, 'cas', Car)

  instance.getCas().should.eq('cas')
})

test('it sets CAS of the loaded resource', () => {
  let instance = new Instance('Car::123', {}, 'cas', Car)

  instance.setCas('new-cas').getCas()
    .should.eq('new-cas')
})

test('it provides the list of referenced models', () => {
  let instance = new Instance('Car::123', {}, null, Car)

  instance.getReferencedModels().should.have.lengthOf(0)
})

test('it checks if the instance has changed data', () => {
  let instance = new Instance('Car::123', {}, null, Car)

  instance.isDirty().should.be.false
})

test('it adds methods to the instance', () => {
  const car = new Instance('Car::123', {
    taxPaid: true
  }, null, Car, {
    instanceMethods: {
      hasPaidTax: function () {
        return this.taxPaid
      }
    }
  })

  car.hasPaidTax().should.be.true
})

test('it saves changed data', async t => {
  Car.storage.replace = (key, data, options) => {
    data.should.include({
      docType: 'Car',
      brand: 'Audi'
    })

    return Promise.resolve({})
  }

  let car = await Car.create({
    brand: 'BMW',
    transmission: {
      gearsCount: 6
    }
  })

  car.brand = 'Audi'
  t.is(car.engine.getId(), null)

  car.isDirty().should.be.true
  await car.save().should.eventually.be.true
  car.brand.should.eq('Audi')

  // errors
  car.brand = false
  car.save().should.be.rejectedWith(TypeError, /Field 'brand' must be a string/)

  Car.storage.replace = (key, data, options) => Promise.reject(new StorageError('error', 123))

  car.brand = 'Porsche'
  car.save().should.be.rejectedWith(StorageError)
})

test('it will not save if the instance has not been changed, but it does not change the behaviour', async () => {
  let car = await Car.create({
    brand: 'BMW'
  })

  car.isDirty().should.be.false

  await car.save().should.eventually.be.true
})

test('it handles array references', async () => {
  const michelin = new Instance('Wheel::123', {
    docId: '123',
    docType: 'Wheel',
    brand: 'Michelin'
  }, null, Wheel)

  let car = new Instance('Car::123', {
    docId: '123',
    docType: 'Car',
    brand: 'BMW',
    wheels: [
      { wheelType: michelin },
      { wheelType: michelin },
      { wheelType: michelin },
      { wheelType: michelin }
    ]
  }, null, Car)

  car.wheels.should.have.lengthOf(4)
})

test('it deletes the entry in the Couchbase', async () => {
  Car.storage.remove = (key, options) => {
    key.should.eq('Car::123')

    return Promise.resolve({})
  }

  let car = new Instance('Car::123', {
    docId: '123',
    docType: 'Car',
    brand: 'BMW'
  }, null, Car)

  await car.delete().should.eventually.be.true

  // error
  Car.storage.remove = (key, options) => Promise.reject(new StorageError('error', 123))

  car.delete().should.be.rejectedWith(StorageError)
})

test('it deletes the referenced entries with the main', async () => {
  Car.storage.remove = (key, options) => {
    ['Car::123', 'Engine::456'].should.include(key)

    return Promise.resolve({})
  }

  let engine = new Instance('Engine::456', {
    docId: '456',
    docType: 'Engine',
    power: '150'
  }, null, Engine)

  let car = new Instance('Car::123', {
    docId: '123',
    docType: 'Car',
    brand: 'BMW',
    engine
  }, null, Car)

  await car.delete().should.eventually.be.true

  // error
  Car.storage.remove = (key, options) => {
    if (key === 'Engine::456') {
      return Promise.reject(new StorageError('error', 123))
    }

    return Promise.resolve({})
  }

  car.delete().should.be.rejectedWith(StorageError)
})

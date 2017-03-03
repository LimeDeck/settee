require('chai').use(require('chai-as-promised')).should()
import test from 'ava'
import td from 'testdouble'
import { connect } from '../../_bootstrap'

import { settee, Schema, Type } from '../../../.test/build'
import Model from '../../../.test/build/entities/model'
import Storage from '../../../.test/build/storage'
import QueryBuilder from '../../../.test/build/services/queryBuilder'
import Instance from '../../../.test/build/entities/instance'
import { SetteeError, StorageError } from '../../../.test/build/errors'

let Car, CarSchema, storage

test.beforeEach.cb(t => {
  connect()
    .then(bucket => {
      settee.useBucket(bucket)

      CarSchema = new Schema('Car', {
        brand: Type.string(),
        color: Type.string()
      })

      storage = td.object(Storage)
      storage.insert = (key, data) => Promise.resolve({ cas: 123 })
      settee.storage = storage

      Car = settee.registerSchema(CarSchema)

      t.end()
    })
})

test.afterEach(() => {
  td.reset()
})

test('it creates model from schema', () => {
  Model.fromSchema(CarSchema).should.be.instanceOf(Model)
})

test('it provides the active storage', () => {
  CarSchema.storage = 'storage'

  const model = Model.fromSchema(CarSchema)

  model.getStorage().should.eq('storage')
})

test('it allows for extensibility', () => {
  Car.addMethods({
    reverseName: function () {
      return this.name.split('').reverse().join('')
    }
  })

  Car.reverseName().should.eq('raC')
})

test('it disallows overwriting of the default methods', t => {
  const err = t.throws(() => {
    Car.addMethods({
      create: function () {
        return 'foo'
      }
    })
  }, SetteeError)

  err.message.should.contain(`Method 'create' cannot`)
})

test('it creates a new model instance', async () => {
  let audi = await Car.create({ brand: 'Audi', color: 'blue' })

  audi.should.be.instanceOf(Instance)
  audi.brand.should.eq('Audi')
  audi.color.should.eq('blue')

  // error
  storage.insert = (key, data) => Promise.reject(new StorageError('error', 123))

  Car.create({ brand: 'Audi', color: 'red' })
    .should.be.rejectedWith(StorageError)
})

test('it manages additional methods forwarded to the model instance', async () => {
  Car.addInstanceMethods({
    getUppercaseBrand: function () {
      return this.brand.toUpperCase()
    }
  })

  let audi = await Car.create({ brand: 'Audi', color: 'blue' })

  audi.getUppercaseBrand().should.eq('AUDI')
})

test('it disallows overwriting of the default instance methods', t => {
  const err = t.throws(() => {
    Car.addInstanceMethods({
      save: function () {
        return 'foo'
      }
    })
  }, SetteeError)

  err.message.should.contain(`Method 'save' cannot`)
})

test('it fails to create a new model instance with invalid data', async () => {
  Car.create({ brand: 'Audi', color: 9000 })
    .should.be.rejectedWith(TypeError)
})

test.serial('it creates referenced models while creating the main one', async () => {
  const EngineSchema = new Schema('Engine', {
    make: Type.string(),
    power: Type.number()
  })

  const Engine = settee.registerSchema(EngineSchema)

  const BikeSchema = new Schema('Bike', {
    brand: Type.string(),
    color: Type.string(),
    engine: Type.reference(Engine)
  })

  const Bike = settee.registerSchema(BikeSchema)

  const honda = await Bike.create({
    brand: 'Honda',
    engine: {
      power: 150
    }
  })

  honda.engine.docId.should.not.be.null

  // error - engine creation fails
  storage.insert = (key, data) => Promise.reject(new StorageError('error', 123))
  Engine.storage = storage

  Bike.create({
    brand: 'Honda',
    engine: {
      power: 150
    }
  }).should.be.rejectedWith(StorageError)
})

test('it provides a query builder and a shorthand', () => {
  Car.query().should.be.instanceOf(QueryBuilder)
  Car.q().should.be.instanceOf(QueryBuilder)
})

test('it executes a raw query', async () => {
  storage.executeQuery = (query, params, options) => {
    return Promise.resolve([
      { docId: '123', docType: 'Car', color: 'red' },
      { docId: '456', docType: 'Car', color: 'blue' }
    ])
  }

  let entries = await Car.rawQuery('SELECT * FROM `default`')

  entries.should.have.lengthOf(2)
  entries[1].should.be.instanceOf(Instance)

  // error
  storage.executeQuery = (query, params, options) => {
    return Promise.reject(new StorageError('error', 123))
  }

  Car.rawQuery('SELECT * FROM `missing`')
    .should.be.rejectedWith(StorageError)
})

test('it finds an entry by key', async () => {
  storage.get = (key) => {
    return Promise.resolve({
      value: { docId: '123', docType: 'Car', color: 'red' },
      cas: '123'
    })
  }

  let car = await Car.findRawByKey('Car::123')

  car.data.should.deep.eq({ docId: '123', docType: 'Car', color: 'red' })
  car.cas.should.eq('123')

  // error
  storage.get = (key) => Promise.reject(new StorageError('error', 123))

  Car.findRawByKey('Car::123')
    .should.be.rejectedWith(StorageError)
})

test('it finds an entry by id', async () => {
  storage.get = (key) => {
    return Promise.resolve({
      value: { docId: '123', docType: 'Car', color: 'red' },
      cas: '123'
    })
  }

  let car = await Car.findById('123')

  car.should.be.instanceOf(Instance)
  car.color.should.eq('red')

  // error
  storage.get = (key) => Promise.reject(new StorageError('error', 123))

  Car.findById('123')
    .should.be.rejectedWith(StorageError)
})

test('it finds multiple entries by keys', async () => {
  storage.getMulti = (keys) => {
    return Promise.resolve([
      {
        value: { docId: '123', docType: 'Car', color: 'red' },
        cas: '123'
      },
      {
        value: { docId: '456', docType: 'Car', color: 'blue' },
        cas: '456'
      }
    ])
  }

  let entries = await Car.findMatchingKeys(['Car::123', 'Car:456'])

  entries.should.have.lengthOf(2)
  entries[0].data.should.deep.eq({ docId: '123', docType: 'Car', color: 'red' })
  entries[0].cas.should.eq('123')

  // error
  storage.getMulti = (keys) => Promise.reject(new StorageError('error', 123))

  Car.findMatchingKeys(['Car::123', 'Car:456'])
    .should.be.rejectedWith(StorageError)
})

test('it errors when it is unable to find any of the keys', async () => {
  storage.getMulti = (keys) => {
    return Promise.resolve([
      {
        value: { docId: '123', docType: 'Car', color: 'red' },
        cas: '123'
      },
      {
        error: new Error(),
        cas: '456'
      }
    ])
  }

  Car.findMatchingKeys(['Car::123', 'Car::456'])
    .should.be.rejectedWith(SetteeError, /Entry 'Car::456' is not/)
})

test('it finds multiple entries by ids', async () => {
  storage.getMulti = (keys) => {
    return Promise.resolve([
      {
        value: { docId: '123', docType: 'Car', color: 'red' },
        cas: '123'
      },
      {
        value: { docId: '456', docType: 'Car', color: 'blue' },
        cas: '456'
      }
    ])
  }

  let entries = await Car.findMatchingIds(['123', '456'])

  entries.should.have.lengthOf(2)
  entries[0].should.be.instanceOf(Instance)

  // error
  storage.getMulti = (keys) => Promise.reject(new StorageError('error', 123))

  Car.findMatchingIds(['123', '456'])
    .should.be.rejectedWith(StorageError)
})

test('it deletes an entry by id', async () => {
  storage.remove = key => Promise.resolve(true)

  Car.deleteById(123)
    .should.eventually.be.true

  // error
  storage.remove = key => Promise.reject(new StorageError('error', 123))

  Car.deleteById(456)
    .should.be.rejectedWith(StorageError)
})

test('it validates the source data for the model against the schema', () => {
  Car.validateData({
    brand: 'BMW',
    color: 'red'
  }).should.be.true
})

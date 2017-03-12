import test from 'ava'
require('chai').use(require('chai-as-promised')).should()
import { connect } from '../../_bootstrap'

import { settee, Type, Schema, SetteeError } from '../../../.test/build'
import Validator from '../../../.test/build/services/validator'

let validator

test.before.cb(t => {
  connect()
    .then(bucket => {
      settee.useBucket(bucket)
      t.end()
    })
})

test.beforeEach(() => {
  validator = new Validator()
})

test('it validates flat schema layout', t => {
  validator.checkSchema(Type.object({
    isActive: Type.boolean(),
    email: Type.string(),
    age: Type.integer(),
    balance: Type.number(),
    registeredAt: Type.date()
  })).should.be.true

  let err = t.throws(() => {
    validator.checkSchema({
      foo: 123
    })
  }, SetteeError)

  err.message.should.contain(`Schema is not valid`)
})

test('it validates data against a flat schema', t => {
  const schemaLayout = Type.object({
    isActive: Type.boolean(),
    email: Type.string()
  })

  validator.checkAgainstSchema({
    isActive: true,
    email: 'john@limedeck.io'
  }, schemaLayout)
  .should.deep.eq({
    isActive: true,
    email: 'john@limedeck.io'
  })

  let err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: 123,
      email: 'john@limedeck.io'
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'isActive' must be a boolean`)
})

test('it validates data against a schema with arrays', t => {
  const schemaLayout = Type.object({
    isActive: Type.boolean(),
    permissions: Type.array(Type.object({
      name: Type.string(),
      slug: Type.string(),
      description: Type.string()
    }))
  })

  validator.checkAgainstSchema({
    isActive: true,
    permissions: [
      { name: 'Update', slug: 'update', description: 'Update entry' },
      { name: 'Delete', slug: 'delete' }
    ]
  }, schemaLayout)
  .should.deep.eq({
    isActive: true,
    permissions: [
      { name: 'Update', slug: 'update', description: 'Update entry' },
      { name: 'Delete', slug: 'delete', description: null }
    ]
  })

  let err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: true,
      permissions: [
        { name: 'Update', slug: 'update', description: 'Update entry' },
        { name: 42 }
      ]
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'name' must be a string`)

  err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: true,
      permissions: [
        { name: 'Update', slug: 'update', description: 'Update entry' },
        { permName: 42 }
      ]
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'permName' is not allowed`)
})

test('it validates data against a nested schema', t => {
  const schemaLayout = Type.object({
    isActive: Type.boolean(),
    email: Type.string(),
    profile: {
      age: Type.integer(),
      dates: {
        registered: Type.boolean()
      }
    }
  })

  validator.checkAgainstSchema({
    isActive: true,
    email: 'john@limedeck.io',
    profile: {
      age: 42,
      dates: {
        registered: true
      }
    }
  }, schemaLayout)
  .should.deep.eq({
    isActive: true,
    email: 'john@limedeck.io',
    profile: {
      age: 42,
      dates: {
        registered: true
      }
    }
  })

  let err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: true,
      email: 'john@limedeck.io',
      profile: {
        age: 18.2,
        dates: {
          registered: true
        }
      }
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'age' must be an integer`)
})

test.serial('it validates data against a schema with referenced models', async t => {
  const ProfileSchema = new Schema('Profile', {
    age: Type.integer()
  })

  const Profile = settee.buildModel(ProfileSchema)
  settee.registerModels([Profile])

  const schemaLayout = Type.object({
    isActive: Type.boolean(),
    email: Type.string(),
    profile: Type.reference(Profile)
  })

  const profile = await Profile.create({
    age: 42
  })

  validator.checkAgainstSchema({
    isActive: true,
    email: 'john@limedeck.io',
    profile: profile
  }, schemaLayout)
  .should.deep.eq({
    isActive: true,
    email: 'john@limedeck.io',
    profile: profile
  })

  await profile.delete()

  let err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: true,
      email: 'john@limedeck.io',
      profile: {
        age: 42
      }
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'profile' must be a valid model instance`)
})

test('it disallows data not present in the schema', t => {
  const schemaLayout = Type.object({
    isActive: Type.boolean(),
    email: Type.string()
  })

  let err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: true,
      email: 'john@limedeck.io',
      name: 'John'
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'name' is not allowed`)
})

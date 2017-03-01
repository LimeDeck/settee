import test from 'ava'
require('chai').use(require('chai-as-promised')).should()
import { connect } from '../../_bootstrap'

import { settee, Type, Schema } from '../../../.test/build'
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
  validator.checkSchema({
    isActive: Type.boolean(),
    email: Type.string(),
    age: Type.integer(),
    balance: Type.number(),
    registeredAt: Type.date()
  }).should.be.true

  let err = t.throws(() => {
    validator.checkSchema({
      isActive: Type.boolean(),
      email: Type.string(),
      age: 42,
      balance: Type.number(),
      registeredAt: Type.date()
    })
  }, TypeError)

  err.message.should.contain(`Field 'age' has invalid type`)
})

test('it validates nested schema layout', t => {
  validator.checkSchema({
    isActive: Type.boolean(),
    email: Type.string(),
    profile: {
      age: Type.integer(),
      dates: {
        registeredAt: Type.date()
      }
    }
  }).should.be.true

  let err = t.throws(() => {
    validator.checkSchema({
      isActive: Type.boolean(),
      email: Type.string(),
      profile: {
        age: Type.integer(),
        dates: {
          registeredAt: Type.date(),
          updatedAt: 'foo'
        }
      }
    })
  }, TypeError)

  err.message.should.contain(`Field 'updatedAt' has invalid type`)
})

test('it validates schema with referenced models on top level', t => {
  const ProfileSchema = new Schema('Profile', {
    age: Type.integer()
  })

  const Profile = settee.registerSchema(ProfileSchema)

  validator.checkSchema({
    isActive: Type.boolean(),
    email: Type.string(),
    profile: Type.reference(Profile)
  }).should.be.true
})

test('it disallows nested referenced models', t => {
  const ProfileSchema = new Schema('Profile', {
    age: Type.integer()
  })

  const Profile = settee.registerSchema(ProfileSchema)

  let err = t.throws(() => {
    validator.checkSchema({
      isActive: Type.boolean(),
      email: Type.string(),
      details: {
        profile: Type.reference(Profile)
      }
    })
  }, TypeError)

  err.message.should.contain('Referenced models must be used only on the top level')
})

test('it validates data against a flat schema', t => {
  const schemaLayout = {
    isActive: Type.boolean(),
    email: Type.string()
  }

  validator.checkAgainstSchema({
    isActive: true,
    email: 'john@limedeck.io'
  }, schemaLayout).should.be.true

  let err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: 'false',
      email: 'john@limedeck.io'
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'isActive' has invalid type`)
})

test('it validates data against a nested schema', t => {
  const schemaLayout = {
    isActive: Type.boolean(),
    email: Type.string(),
    profile: {
      age: Type.integer(),
      dates: {
        registeredAt: Type.date()
      }
    }
  }

  validator.checkAgainstSchema({
    isActive: true,
    email: 'john@limedeck.io',
    profile: {
      age: 42,
      dates: {
        registeredAt: Date.now()
      }
    }
  }, schemaLayout).should.be.true

  let err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: true,
      email: 'john@limedeck.io',
      profile: {
        age: false,
        dates: {
          registeredAt: Date.now()
        }
      }
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'age' has invalid type`)
})

test('it validates data against a schema with referenced models', t => {
  const ProfileSchema = new Schema('Profile', {
    age: Type.integer()
  })

  const Profile = settee.registerSchema(ProfileSchema)

  const schemaLayout = {
    isActive: Type.boolean(),
    email: Type.string(),
    profile: Type.reference(Profile)
  }

  validator.checkAgainstSchema({
    isActive: true,
    email: 'john@limedeck.io',
    profile: {
      age: 42
    }
  }, schemaLayout).should.be.true
})

test('it disallows data not present in the schema', t => {
  const schemaLayout = {
    isActive: Type.boolean(),
    email: Type.string()
  }

  let err = t.throws(() => {
    validator.checkAgainstSchema({
      isActive: true,
      email: 'john@limedeck.io',
      name: 'John'
    }, schemaLayout)
  }, TypeError)

  err.message.should.contain(`Field 'name' is not present in the schema`)
})

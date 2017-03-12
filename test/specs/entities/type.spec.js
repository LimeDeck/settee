import test from 'ava'
require('chai').use(require('chai-as-promised')).should()
import { connect } from '../../_bootstrap'

const Joi = require('joi')
const moment = require('moment')
import { Type, Schema, settee } from '../../../.test/build'
import Instance from '../../../.test/build/entities/instance'

test.before.cb(t => {
  connect()
    .then(bucket => {
      settee.useBucket(bucket)
      t.end()
    })
})

test('it defaults basic data types to null', t => {
  const schema = Type.object({
    b: Type.boolean(),
    s: Type.string(),
    i: Type.integer(),
    n: Type.number(),
    o: Type.object({}),
    d: Type.date()
  })

  const result = Joi.validate({}, schema)

  t.is(result.error, null)
  t.is(result.value.b, null)
  t.is(result.value.s, null)
  t.is(result.value.i, null)
  t.is(result.value.n, null)
  t.is(result.value.o, null)
  t.is(result.value.d, null)
})

test('it defaults array type to empty array', t => {
  const schema = Type.object({
    a: Type.array(Type.string())
  })

  const result = Joi.validate({}, schema)

  t.is(result.error, null)
  result.value.a.should.deep.eq([])
})

test('it supports default values for all types', t => {
  const schema = Type.object({
    b: Type.boolean(false),
    s: Type.string('foo'),
    i: Type.integer(42),
    n: Type.number(3.14),
    o: Type.object({ s: Type.string() }, { s: 'bar' }),
    a: Type.array(Type.number(), [123, 456]),
    d: Type.date(moment.utc('2017-02-23T19:32:13+00:00'))
  })

  let result = Joi.validate({}, schema)

  t.is(result.error, null)
  result.value.b.should.be.false
  result.value.s.should.eq('foo')
  result.value.i.should.eq(42)
  result.value.n.should.eq(3.14)
  result.value.o.should.deep.eq({ s: 'bar' })
  result.value.a.should.deep.eq([123, 456])
  t.truthy(
    result.value.d.isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )
})

test('it supports callback as default value all types', t => {
  const schema = Type.object({
    b: Type.boolean(() => false, 'boolean callback'),
    s: Type.string(() => 'foo', 'string callback'),
    i: Type.integer(() => 42, 'integer callback'),
    n: Type.number(() => 3.14, 'number callback'),
    o: Type.object({ s: Type.string() }, () => { return { s: 'bar' } }, 'object callback'),
    a: Type.array(Type.number(), () => [123, 456], 'array callback'),
    d: Type.date(() => moment.utc('2017-02-23T19:32:13+00:00'), 'date callback')
  })

  let result = Joi.validate({}, schema)

  t.is(result.error, null)
  result.value.b.should.be.false
  result.value.s.should.eq('foo')
  result.value.i.should.eq(42)
  result.value.n.should.eq(3.14)
  result.value.o.should.deep.eq({ s: 'bar' })
  result.value.a.should.deep.eq([123, 456])
  t.truthy(
    result.value.d.isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )
})

test('it supports timestamp in ms as default value for date type', t => {
  const schema = Type.object({
    d: Type.date(1487878333000)
  })

  const result = Joi.validate({}, schema)

  t.is(result.error, null)
  result.value.d.should.eq(1487878333000)
})

test('it supports valid ISO date string as default value for date type', t => {
  const schema = Type.object({
    d: Type.date('2017-02-23T19:32:13+00:00')
  })

  const result = Joi.validate({}, schema)

  t.is(result.error, null)
  result.value.d.should.eq('2017-02-23T19:32:13+00:00')
})

test('it provides moment instance after successful date validation', t => {
  const schema = Type.object({
    d: Type.date()
  })

  // moment instance
  let result = Joi.validate({
    d: moment.utc('2017-02-23T19:32:13+00:00')
  }, schema)

  t.is(result.error, null)
  t.truthy(
    result.value.d.isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )

  // valid datetime string
  result = Joi.validate({
    d: '2017-02-23T19:32:13+00:00'
  }, schema)

  t.is(result.error, null)
  t.truthy(
    result.value.d.isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )

  // invalid datetime string
  result = Joi.validate({
    d: '20170223T1932130000'
  }, schema)

  result.error.details[0].message.should.contain('must be a valid momentjs instance')
})

test('it supports array of objects', t => {
  const RoleSchema = new Schema('Role', {
    name: Type.string()
  })

  const Role = settee.buildModel(RoleSchema)

  let admin = new Instance('Role::123', {
    docId: '123',
    docType: 'Role',
    name: 'admin'
  }, null, Role)

  let manager = new Instance('Role::456', {
    docId: '456',
    docType: 'Role',
    name: 'manager'
  }, null, Role)

  const schema = Type.array(Type.object({
    name: Type.string(),
    role: Type.reference(Role)
  }))

  let result = Joi.validate([
    { name: 'Mike', role: admin },
    { name: 'John', role: admin },
    { name: 'Jack', role: manager }
  ], schema)

  t.is(result.error, null)

  // error
  result = Joi.validate([
    { name: 'Mike', role: 'developer' }
  ], schema)

  t.not(result.error, null)

  result.error.details[0].message.should.contain('must be a valid model instance')
})

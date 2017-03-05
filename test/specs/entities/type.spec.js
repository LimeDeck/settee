import test from 'ava'
require('chai').use(require('chai-as-promised')).should()

const moment = require('moment')
import { Type } from '../../../.test/build'

test('it defaults basic data types to null', t => {
  t.is(Type.boolean().getDefaultValue(), null)
  t.is(Type.string().getDefaultValue(), null)
  t.is(Type.integer().getDefaultValue(), null)
  t.is(Type.number().getDefaultValue(), null)
})

test('it defaults date type to null', t => {
  t.is(Type.date().getDefaultValue(), null)
})

test('it defaults array type to empty array', () => {
  Type.array().getDefaultValue().should.deep.eq([])
})

test('it supports boolean as default value for boolean type', t => {
  Type.boolean(true).getDefaultValue().should.be.true
  Type.boolean(false).getDefaultValue().should.be.false

  const err = t.throws(() => {
    Type.boolean('true')
  }, TypeError)

  err.message.should.contain(`Invalid 'boolean' format`)
})

test('it supports callback as default value for boolean type', t => {
  Type.boolean(() => true || false).getDefaultValue().should.be.true

  const err = t.throws(() => {
    Type.boolean(() => 'true')
  }, TypeError)

  err.message.should.contain(`Invalid 'boolean' format`)
})

test('it supports string as default value for string type', t => {
  Type.string('foobar').getDefaultValue().should.eq('foobar')

  const err = t.throws(() => {
    Type.string(false)
  }, TypeError)

  err.message.should.contain(`Invalid 'string' format`)
})

test('it supports callback as default value for string type', t => {
  Type.string(() => 'baz').getDefaultValue().should.eq('baz')

  const err = t.throws(() => {
    Type.string(() => 15)
  }, TypeError)

  err.message.should.contain(`Invalid 'string' format`)
})

test('it supports integer as default value for integer type', t => {
  Type.integer(42).getDefaultValue().should.eq(42)

  const err = t.throws(() => {
    Type.integer(false)
  }, TypeError)

  err.message.should.contain(`Invalid 'integer' format`)
})

test('it supports callback as default value for integer type', t => {
  Type.integer(() => 69).getDefaultValue().should.eq(69)

  const err = t.throws(() => {
    Type.integer(() => 9.81)
  }, TypeError)

  err.message.should.contain(`Invalid 'integer' format`)
})

test('it supports number (integer or float) as default value for number type', t => {
  Type.number(3.14).getDefaultValue().should.eq(3.14)
  Type.number(42).getDefaultValue().should.eq(42)

  const err = t.throws(() => {
    Type.number('3.14')
  }, TypeError)

  err.message.should.contain(`Invalid 'number' format`)
})

test('it supports callback as default value for number type', t => {
  Type.number(() => 2.718).getDefaultValue().should.eq(2.718)
  Type.number(() => 42).getDefaultValue().should.eq(42)

  const err = t.throws(() => {
    Type.number(() => [42])
  }, TypeError)

  err.message.should.contain(`Invalid 'number' format`)
})

test('it supports timestamp in ms as default value for date type', t => {
  t.truthy(
    Type.date(1487878333000).getDefaultValue()
      .isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )

  const err = t.throws(() => {
    Type.date(false)
  }, TypeError)

  err.message.should.contain(`Invalid 'date' format`)
})

test('it supports valid ISO date string as default value for date type', t => {
  t.truthy(
    Type.date('2017-02-23T19:32:13+00:00').getDefaultValue()
      .isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )
})

test('it supports valid moment instance as default value for date type', t => {
  t.truthy(
    Type.date(moment.utc('2017-02-23T19:32:13+00:00')).getDefaultValue()
      .isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )
})

test('it supports callback as default value for date type', t => {
  Type.date(() => Date.now()).getDefaultValue().year()
    .should.eq(new Date().getFullYear())

  t.truthy(
    Type.date(() => moment.utc('2017-02-23T19:32:13+00:00')).getDefaultValue()
      .isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )

  t.truthy(
    Type.date(() => '2017-02-23T19:32:13+00:00').getDefaultValue()
      .isSame(moment.utc('2017-02-23T19:32:13+00:00'))
  )

  const err = t.throws(() => {
    Type.date(() => '1487878333000')
  }, TypeError)

  err.message.should.contain(`Invalid 'date' format`)
})

test('it supports array as default value for array type', t => {
  Type.array([1, 2, 3]).getDefaultValue().should.deep.eq([1, 2, 3])

  const err = t.throws(() => {
    Type.array({ 1: 'foo' })
  }, TypeError)

  err.message.should.contain(`Invalid 'array' format`)
})

test('it supports callback as default value for array type', t => {
  Type.array(() => ['foo', 'bar', 3]).getDefaultValue()
    .should.deep.eq(['foo', 'bar', 3])

  const err = t.throws(() => {
    Type.array(() => 15)
  }, TypeError)

  err.message.should.contain(`Invalid 'array' format`)
})


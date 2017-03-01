require('chai').use(require('chai-as-promised')).should()
import test from 'ava'

import { SetteeError } from '../../../.test/build/errors'
import SchemaContainer from '../../../.test/build/services/schemaContainer'

let StubModel, StubSchema, schemaContainer

test.beforeEach(() => {
  StubModel = 'model'
  StubSchema = {
    name: 'Foo',
    layout: {}
  }

  schemaContainer = new SchemaContainer()
})

test('it adds schema to the list and retrieves it', () => {
  schemaContainer.add(StubSchema, StubModel)

  schemaContainer.get('Foo').should.deep.eq({
    model: StubModel,
    layout: StubSchema.layout
  })
})

test('it retrieves the model directly', () => {
  schemaContainer.add(StubSchema, StubModel)

  schemaContainer.getModel('Foo').should.deep.eq(StubModel)
})

test('it disallows access to unregistered schemas', t => {
  schemaContainer.add(StubSchema, StubModel)

  const err = t.throws(() => {
    schemaContainer.get('Bar')
  }, SetteeError)

  err.message.should.contain(`Schema 'Bar' has not been registered.`)
})

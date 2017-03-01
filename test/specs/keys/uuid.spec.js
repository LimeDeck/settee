import test from 'ava'
require('chai').use(require('chai-as-promised')).should()

import Key from '../../../.test/build/keys/key'
import { KeyError } from '../../../.test/build/errors'
import UuidKey from '../../../.test/build/keys/uuid'

let uuidKey

test.beforeEach(() => {
  uuidKey = new UuidKey('Car')
})

test('it extends abstract Key', () => {
  uuidKey.should.be.instanceOf(Key)
})

test('it requires schema name for key generation', t => {
  t.throws(() => {
    // eslint-disable-next-line no-new
    new UuidKey()
  }, KeyError, /Schema name is required/)
})

test('it generates random key with schema name', () => {
  uuidKey.getKey().should.match(/Car::[0-9a-f-]+/)
})

test('it generates uuid v4 as id part of the key', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  uuidKey.getId().should.match(uuidRegex)
})

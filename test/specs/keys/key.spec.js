import test from 'ava'

import Key from '../../../.test/build/keys/key'
import { KeyError } from '../../../.test/build/errors'

test('it is abstract', t => {
  t.throws(() => {
    // eslint-disable-next-line no-new
    new Key()
  }, KeyError, /abstract class/)
})

test('a child must implement abstract generate method', t => {
  class Stub extends Key {}

  t.throws(() => {
    // eslint-disable-next-line no-new
    new Stub('Stub')
  }, KeyError, /abstract method/)
})

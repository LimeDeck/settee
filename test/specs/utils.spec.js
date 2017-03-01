require('chai').use(require('chai-as-promised')).should()
import test from 'ava'

import { buildKey } from '../../.test/build/utils'

test('it builds Couchbase key from schema name and id', () => {
  buildKey('Car', '123').should.eq('Car::123')
})

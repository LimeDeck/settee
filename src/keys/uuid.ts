import { v4 as uuid } from 'uuid'
import Key from './key'

/**
 * Uuid class for generating UUID v4 keys.
 */
export default class Uuid extends Key {

  /**
   * Generates a key for the schema.
   *
   * @throws {KeyError}
   */
  protected generate (): void {
    this.setId(uuid())
  }
}

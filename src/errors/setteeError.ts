/**
 * General Settee Error class.
 */
export default class SetteeError extends Error {

  /**
   * SetteeError constructor
   */
  constructor (message) {
    super(message)

    this.name = this.constructor.name

    /* istanbul ignore else */
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = (new Error(message)).stack
    }
  }
}

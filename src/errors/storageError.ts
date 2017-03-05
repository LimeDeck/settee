import SetteeError from './setteeError'

/**
 * Storage Error class related couchbase communication.
 */
export default class StorageError extends SetteeError {

  public code: number
  public document: any
  public index: null

  /**
   * KeyError constructor
   */
  constructor (message: string, code: number, document?: any) {
    super(message)

    this.name = 'StorageError'
    this.code = code
    this.document = document || null
    this.index = null
  }
}

import SetteeError from './setteeError';
/**
 * Storage Error class related couchbase communication.
 */
export default class StorageError extends SetteeError {
    code: number;
    document: any;
    index: null;
    /**
     * KeyError constructor
     */
    constructor(message: string, code: number, document?: any);
}

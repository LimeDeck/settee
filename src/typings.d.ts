import {
  BucketManager as CbBucketManager,
  Bucket as CbBucket, CouchbaseError
} from 'couchbase'
import CAS = CbBucket.CAS
import { Schema as JoiSchema } from 'joi'

export declare type CouchbaseIndex = {
  name: string
  using: string
}

export declare type Index = {
  by: string|string[]
}

export declare type SchemaIndexes = {
  [key: string]: Index
}

export declare type IndexData = {
  schemaName: string,
  indexName: string,
  index: Index
}

export declare type Methods = {
  [key: string]: Function
}

export declare type Layout = {
  isJoi?: boolean,
  [key: string]: JoiSchema|Layout|Layout[]
}

export declare type ReferencedModels = Array<{
  position: any,
  data: any,
  model: string,
  pathToModel: string
}>

export declare type ModelInstance = {
  key: string,
  cas: CAS,
  data: any,
  id: string,
  type: string,
  dirty: boolean,
  monitoredProperties: Set<string>,
  referencedModels: ReferencedModels
}

export declare type StorageObject = {
  value: string,
  cas: CAS
}

export declare type ModelObject = {
  key?: string,
  data: string,
  cas: CAS
}

export { CAS }

export interface Bucket extends CbBucket {
  _name: string,

  getMulti (
    key: string[] | Buffer[], options: any,
    callback: (error: number, results: CbMultiGetResult) => void
  ): void

  manager (): BucketManager,

  on (
    eventName: string,
    callback: () => any
  ): void
}

export interface BucketManager extends CbBucketManager {
  createIndex (
    name: string, indexFields: string[], options: any,
    callback: (error: CouchbaseError) => void
  ): void,

  dropIndex (
    name: string, options: any,
    callback: (error: CouchbaseError) => void
  ): void
}

export declare type CbResult = {
  cas: CAS,
  token: any
}

export declare type CbGetResult = {
  cas: CAS,
  value: any,
  error?: any
}

export declare type CbMultiGetResult = {
  [key: string]: CbGetResult
}

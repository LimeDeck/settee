# Settee
> Modern JavaScript ODM for Couchbase 🛋️


[![Build Status](https://travis-ci.org/LimeDeck/settee.svg?branch=master)](https://travis-ci.org/LimeDeck/settee)
[![Coverage Status](https://coveralls.io/repos/github/LimeDeck/settee/badge.svg?branch=master)](https://coveralls.io/github/LimeDeck/settee?branch=master)
[![GitHub release](https://img.shields.io/github/release/LimeDeck/settee.svg)](https://github.com/limedeck/settee)


Settee is a modern ODM for Couchbase (and Node.js), featuring a custom query builder, and fast, easy-to-use code.

## Contents

- [Installation](#installation)
- [Introduction](#introduction)
- [Usage](#usage)
- [API](#api)
- [Team](#team)
- [Contributing](#contributing)
- [License](#license)

## Why Settee

- Robust, well-documented source code written in TypeScript (compiled to ES6)
- 100% test coverage with over 100 tests
- Includes type definitions (IDE typehint support!)
- Custom query builder with chainable statements and paginator
- Custom type definitions for schemas with default values
- Unlimited nesting within schemas
- Referenced Models
- Powerful schema layouts with awesome [Joi](https://github.com/hapijs/joi) powered validation
- Indexer
- Fully Promise based code with async-await support (no more callbacks!)

## Installation
To install Settee, just run the following:

```console
$ yarn add settee
#... or npm
$ npm install settee --save
```

> Note: This package was only tested on Node.js versions 6 and 7 or higher.

## Introduction
First, you need to setup your connection to Couchbase. We have included that functionality with Settee.

```javascript
import { settee, Schema, Type } from 'settee'

// Connect to the cluster.
await settee.connect('127.0.0.1', 'default')

// Create a new schema for a Car.
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  color: Type.string()
})

// Build a Model
const Car = settee.buildModel(CarSchema)

// Create a new Car entry in the database.
let audi = await Car.create({
  brand: 'Audi',
  color: 'red'
})

```

## Usage

This section will cover most of Settee's use cases. For more detailed API reference, click [here](#api). In our usage examples, we use car, engine and user examples to demonstrate the usage in real-world applications.

> Note: Most of these examples require a connection to the Bucket. Check out `settee.connect()` in the API reference.

List of examples:

- [Defining a Schema](#defining-a-schema)
- [Creating a new entry in the database](#creating-a-new-entry)
- [Modifying an entry](#modifying-an-entry)
- [Creating indexes](#creating-indexes)
- [Queries](#queries)
- [Nested data](#nested-data)
- [Referenced Models](#referenced-models)
- [Accessing registered models](#accessing-registered-models)

### Defining a Schema

Schema is the core entity of Settee. It describes the structure of mapped instances and provides useful checks to ensure that only the correct entries are persisted in the cluster. Individual items in the Schema are referred to as Types. Types are mostly basic data types, such as number, object, string, etc. Check out the [Types](#Types) API reference for detailed overview.

Example: We want to create a schema for a car. Our car will have 3 properties: `brand`, `topSpeed` and `taxPaid`.

```javascript
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  topSpeed: Type.number(),
  taxPaid: Type.boolean(false)
})
```

Car's brand is a string, like `Audi`. Top speed is defined as number, like `192` (kph) and tax Paid is a boolean, with a default value of `false`. You can pass default values to **any** of the Types. Let's say we want all cars to be created with a top speed of a 100 kph, and we will modify them later. 

```javascript
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  topSpeed: Type.number(100),
  taxPaid: Type.boolean(false)
})
```

After you set your schema, build a model from it.

```javascript
const Car = settee.buildModel(CarSchema)
```

> `Car` is now a Model.

### Creating a new entry

To create a new entry in the database, first you have to define a Schema. We have already done that in the [previous example](#defining-a-schema). We now have a `Car` constant which is a Model. Let's create a new car:

```javascript
let audi = await Car.create({
  brand: 'Audi',
  topSpeed: 220,
  taxPaid: true
})
```

This will store a new entry in our database. Behind the scenes, we add a `docType` and a `docId` to the entry, so it's possible to find it, edit and more. You can now access the individual properties of the entry like this:

```javascript
audi.brand // "Audi"
audi.topSpeed // 220
audi.taxPaid // true
```

> Note: Create runs Couchbase Insert behind the scenes.

### Modifying an entry

We have already created a car entry in the database. Let's say we didn't really pay tax and the top speed is 250. Let's edit the entry!

```javascript
// audi is an Instance
audi.topSpeed = 250
audi.taxPaid = false

await audi.save()
```

`Model.save()` updates an existing entry. Please note that Settee will validate the data you input, and will be rejected with an error if the data types are incorrect:

```javascript
audi.topSpeed = false
audi.taxPaid = false

await audi.save() // gets rejected
```

### Creating indexes

Indexes are very useful for faster lookups. Let's say we have a lot of cars in our database, and we usually look them up by `brand`. Let's add an index for it, so the search is faster!

```javascript
// define our schema
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  topSpeed: Type.number(),
  taxPaid: Type.boolean()
})

CarSchema.addIndexes({
  findByBrand: { by: 'brand' }
})
```

After that, we need to make sure that we build a model from our Schema, and the indexes are ready to use. We can achieve that like this:

```javascript
// Build a Model from our Schema
const Car = settee.buildModel(CarSchema)

// ensure that the indexes are ready
await settee.buildIndexes()
```

Settee also supports multi-key index. Let's say we'd like to have faster lookups for both `brand` and `taxPaid`:

```javascript
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  topSpeed: Type.number(),
  taxPaid: Type.boolean()
})

CarSchema.addIndexes({
  findByBrand: { by: 'brand' },
  findByBrandAndTax: { by: ['brand', 'taxPaid'] }
})

const Car = settee.buildModel(CarSchema)

await settee.buildIndexes()
```

> Note: Settee creates N1QL indexes behind the scenes.

### Queries

Settee features a powerful QueryBuilder. You can do a lot with it, and to check out the full functionality, check out the [QueryBuilder](#query-builder) API reference.

Here are a few use cases of the QB. Note that calling `settee.buildModel()` is required for these operations.


```javascript
// our Model is defined as 'Car'

// This query will get you all Audi cars, 
// where top speed is greater or equal to 190 kph, 
// and tax is paid.
let results = Car.query()
  .where('brand', 'Audi')
  .where('topSpeed', '>=', 190)
  .whereNot('taxPaid', false)
  .get()
  
// but if you only want one car entry retrieved 
let results = Car.query()
  .where('brand', 'Audi')
  .where('topSpeed', '>=', 190)
  .whereNot('taxPaid', false)
  .first()
  
// if you want to know the count of the cars matching the criteria
let results = Car.query()
  .where('brand', 'Audi')
  .where('topSpeed', '>=', 190)
  .whereNot('taxPaid', false)
  .count()
  
// if you want to retrieve ALL cars, regardless of the criteria
let results = Car.all()
```

### Nested data

Nested data is useful when you want a little bit more structure with your data.  In our example, we have a User schema, that contains Profile information for the user. With Settee, this can be achieved like this:

```javascript
const UserSchema = {
  email: Type.string(),
  password: Type.string(),
  profile: {
    age: Type.integer(),
    names: {
      first: Type.string(),
      last: Type.string()
    }
  }
}

const User = settee.buildModel(UserSchema)

let joe = await User.create({
  email: 'joe@limedeck.io',
  password: 'hashedString',
  profile: {
    age: 26,
    names: {
      first: 'Joe',
      last: 'Persson'
    }
  }
})

// and you can access all the properties like usual
joe.email // 'joe@limedeck.io'
joe.profile.age // 26
joe.profile.name.first // 'Joe'
joe.profile.name.last // 'Persson'
```

### Referenced Models

Referenced models are useful when nesting data is not an option. Let's say you have multiple cars in your database, and their engines are relatively similar. The point of a reference is that you can reuse it in multiple different entries.

Let's build our example:

```javascript
// Create our Engine Schema first.
const EngineSchema = new Schema('Engine', {
  make: Type.string(),
  power: Type.number()
})

const Engine = settee.buildModel(EngineSchema)

// we define the Engine as Type.reference(Engine)
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  topSpeed: Type.number(),
  taxPaid: Type.boolean(),
  engine: Type.reference(Engine)
})

const Car = settee.buildModel(CarSchema)

let bmwEngine = await Engine.create({
  power: 150,
  make: 'Bayerische Motoren Werke AG'
})

let bmw = await Car.create({
  brand: 'BMW',
  engine: bmwEngine
})

// you can now access the engine directly
bmw.brand // 'BMW'
bmw.engine.power // 150
bmw.engine.make // 'Bayerische Motoren Werke AG'

// and you can also update the engine individually
bmw.engine.power = 200
await bmw.engine.save()
```

### Accessing registered models

Settee gives you access to your models from any file in your source code. There are two approaches of accessing them.

Let's say we have an index.js file:
 
```javascript
// Create our Engine Schema first.
const EngineSchema = new Schema('Engine', {
  make: Type.string(),
  power: Type.number()
})

const Engine = settee.buildModel(EngineSchema)

// we define the Engine as Type.reference(Engine)
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  topSpeed: Type.number(),
  taxPaid: Type.boolean(),
  engine: Type.reference(Engine)
})

const Car = settee.buildModel(CarSchema)

export { Car, Engine }
```

In another file, you can access the models either by importing them, or through `settee.getModel(modelName)`:

```javascript
// using direct import
import { Car } from './index'

// using settee.getModel()
let Car = settee.getModel('Car')

// you now have access to all Car model methods. Both approaches are equivalent.
```

## API

This is our public API reference. Arguments wrapped in square brackets like `[argument]` are required arguments. Methods that return Promises are noted with async before the method name. The return type is noted after the method's name.

Contents:

- [Settee](#settee)
- [Schema](#schema)
- [Types](#types)
- [Query Builder](#query-builder)
- [Model](#model)
- [Mapped Instance](#mapped-instance)

### Settee

Main settee file.

Imported via:

```javascript
import { settee } from 'settee'
```

**Available Methods**:

#### `async connect([clusterUrl], [bucketName]): Bucket`

Establishes the connection to the bucket. Sets an active bucket.

Arguments: 

- `clusterUrl` (string) - URL that points to the cluster.
- `bucketName` (string) - Name of the bucket you are connecting to.

#### `async disconnect(): void`

Terminates the connection to the bucket.

#### `useBucket([bucket]): void`

Sets the active bucket.

Arguments:

- `bucket` (Bucket) - Resolved and connected bucket. See typings.d.ts for reference.

#### `getBucket(): Bucket`

Provides the active bucket instance.

#### `getStorage(): Storage`

Provides the active storage instance.

#### `buildModel([schema]): Model`

Provides a model based on the schema.

Arguments:

- `schema` (Schema) - instance of Schema.

#### `registerModels([Models]): void`

Registers a set of provided models. Useful when you have to reference the models after the `settee.connect()` method, e.g. when you have a dedicated DB class which uses models specified in separate files/modules.

Arguments:

- `Models` (Model) - Array of Models

Example:

```javascript
const EngineSchema = new Schema('Engine', {
  make: Type.string(),
  power: Type.number()
})

const Engine = settee.buildModel(EngineSchema)

settee.registerModels([Engine])
```

#### `async buildIndexes(): boolean`

Builds deferred indexes.

**Available properties:**

#### `consistency`

Helps you retrieve the Couchbase consistency without having to remember all the different values. Useful for N1QL operations.

Usage:

```javascript
settee.consistency.NOT_BOUND
settee.consistency.REQUEST_PLUS
settee.consistency.STATEMENT_PLUS
```

#### `registeredSchemas`

Retrieves all registered schemas.

#### `getModel([name]): Model`

Provides a registered model. Accessible from anywhere where `settee` instance is available.

Arguments:

- `name` (string) - Model name

### Schema

Schema class.

Imported via:

```javascript
import { Schema } from 'settee'
```

**Available Methods**:

#### `constructor([name], [layout])`

Schema constructor.

Arguments:

- `name` (string) - Name of the schema.
- `layout` (object) - Object containing Types.

#### `useStorage([storage]): void`

Sets the active storage for the schema.

Arguments:

- `storage` (Storage) - Storage instance

#### `getActiveStorage(): Storage`

Provides the active storage.

#### `getValidator(): Validator`

Provides the validator instance.

#### `addIndexes([indexes]): Schema`

Adds indexes to the list.

Arguments:

- `indexes` (object) - Object containing indexes. Needs to contain the `by` property, and it can be either a string, or an array of strings (if you want an index containing multiple keys)

```javascript
let indexes = {
  findByColor: {
    by: 'color'
  },
  findByColorAndBrand: {
   by: ['color', 'brand']
  }
}
```

#### `async seeIndex([name], type): boolean`

Verifies if the index is present in the database.

Arguments:

- `name` (string) - Name of the index you are looking up.
- `type` (string) - Index type. By default, 'GSI' is used.

#### `async dropIndex([name], options): boolean`

Drops index by name.

Arguments: 

- `name` (string) - Name of the index.
- `options` (object) - Additional options.

### Types

Imported via:

```javascript
import { Type } from 'settee'
```

Types are data types, used by Schema for ensuring data and types in the database entries are valid. The validation behind the scenes ensures you can't override a `Number` with a `boolean` by mistake, for example. 

Types have an optional default value. This value will be used when creating a new entry without having to supply the value again when creating entries.

The methods for `Type` are static, so you can call them without having to instantiate `Type`, i.e.:

```javascript
Type.boolean(false)
Type.string('foo')
Type.integer(42)
Type.number(3.14)
Type.array(Type.string(), ['foo', 'bar'])
```

These are the basic Types.

#### `boolean(defaultValue): JoiInstance`
Defaults to `null` when no defaultValue is supplied.

#### `string(defaultValue): JoiInstance`
Defaults to `null` when no defaultValue is supplied.

#### `integer(defaultValue): JoiInstance`
Defaults to `null` when no defaultValue is supplied.

#### `number(defaultValue): JoiInstance`
Defaults to `null` when no defaultValue is supplied.

Arguments:

- `defaultValue` (any|Function) - Value for the corresponding data type. If the argument passed is a function, the function will be evaluated as well.

These are the special Types:

#### `array([Type], defaultValue): JoiInstance`
Defaults to `[]` when no defaultValue is supplied.

Arguments:

- `type` (Type) - Any of the available Types.
- `defaultValue` (any|Function) - Value for the corresponding data type. If the argument passed is a function, the function will be evaluated as well.

#### `date(defaultValue): JoiInstance`
Defaults to `null` when no defaultValue is supplied. 

If a defaultValue is supplied, it returns a [moment](https://momentjs.com/) instance, so you can process it however you'd like (parse, manipulate, add, localize, etc).

Arguments:

- `defaultValue` (any|Function) - Can be a ms timestamp, ISO date, or a moment instance, although using a moment instance is advised for consistency reasons.

> Note: We return a moment instance in the UTC timezone.

#### `reference([model]): JoiInstance`

Reference entry type. Provides an object when saving referenced models.

Arguments:

- `model` (Model) - A referred Model.


### Query Builder

Not exported directly. You have to register a Schema first, in order to retrieve the Model, where the Query Builder (QB) is exposed:

```javascript
import { settee, Schema } from 'settee'

const CarSchema = new Schema('Car', {
  brand: Type.string(),
  topSpeed: Type.number(),
  taxPaid: Type.boolean()
})

const Car = settee.buildModel(CarSchema)
```

Now you can instantiate the QB directly like `Schema.query()` or `Schema.q()` as shorthand.

```javascript
Car.query() // or Car.q()
```

> Note: You have to call either `get()` or `first()` after your query chain. Otherwise, you will not be able to retrieve any results.

Afterwards, you will have access to these **methods**:

#### `where([field], [operator], value)`

Adds a `WHERE` clause. You can chain however many wheres you want.

Arguments: 

- `field` (string) - The field you are looking to match the value.
- `operator` (any) - Can either be a logical operator, or a value, if you are trying to match `field === value`
- `value` (any) - Value you're looking up to match the logical operator and the field

Examples:

```javascript
Car.q().where('brand', '=', 'Audi')

// is the same as
Car.q().where('brand, 'Audi')

Car.q().where('topSpeeed', '<=', 190)

// And you can chain multiple wheres as well
Car.q()
  .where('brand', 'Audi')
  .where('topSpeeed', '<=', 190)
  ...
```

**Allowed operators**:

```
'=', // equal
'==', // equal
'<', // less than
'<=', // less or equal
'>', // greater than
'>=', // greater or equal
'!=', // not equal
'<>', // not equal
'LIKE',
'like',
'NOT LIKE', 
'not like'
```

#### `whereNot([field], [value])`

Adds a `WHERE NOT` clause. You can chain however many whereNots you want.

Arguments:

- `field` (string) - The field you are looking to match the value.
- `value` (any) - Value you're looking up to match the whereNot clause

Example:

```javascript
Car.q().whereNot('brand', 'BMW')
```

#### `whereIn([field], [values])`

Adds a `WHERE IN` clause. You can chain however many whereIns you want.

Arguments:

- `field` (string) - The field you are looking to match the value.
- `value` (any[]) - Value you're looking up to match the whereIn clause

Example:

```javascript
Car.q().whereIn('brand', ['BMW', 'Honda'])
```

#### `whereNotIn([field], [values])`

Adds a `WHERE NOT IN` clause. You can chain however many whereNotIns you want.

Arguments:

- `field` (string) - The field you are looking to match the value.
- `value` (any[]) - Value you're looking up to match the whereNotIn clause

Example:

```javascript
Car.q().whereNotIn('brand', ['Mercedes-Benz', 'Toyota'])
```

#### `whereBetween([field], [min], [max])`

Adds a `WHERE BETWEEN min AND max` clause. You can chain however many whereBetweens you want.

Arguments:

- `field` (string) - The field you are looking to match the values.
- `min` (any[]) - first (lowest => min) value of the whereBetween
- `max` (any[]) - last (highest => max) value of the whereBetween

Example:

```javascript
Car.q().whereBetween('topSpeed', 190, 250)
```

#### `whereNotBetween([field], [min], [max])`

Adds a `WHERE NOT BETWEEN min AND max` clause. You can chain however many whereNotBetweens you want.

Arguments:

- `field` (string) - The field you are looking to match the values.
- `min` (any[]) - first (lowest => min) value of the whereNotBetween
- `max` (any[]) - last (highest => max) value of the whereNotBetween

Example:

```javascript
Car.q().whereNotBetween('topSpeed', 180, 199)
```

#### `whereNull([field])`

Adds a `WHERE NULL` clause. You can chain however many whereNulls you want.

Arguments:

- `field` (string) - The field you are looking to match the null values.

Example:

```javascript
Car.q().whereNull('topSpeed')
```

#### `whereNotNull([field])`

Adds a `WHERE NOT NULL` clause. You can chain however many whereNotNulls you want.

Arguments:

- `field` (string) - The field you are looking to match the null values.

Example:

```javascript
Car.q().whereNotNull('topSpeed')
```

#### `offset([count])`

Offsets the results.

Arguments:

- `count` (integer) - Number of objects to be skipped.

Example:

```javascript
// will start from the 11th car
Car.q().where('brand', 'BMW').offset(10)
```

#### `limit([count])`

Limits the count of the results selected by the query.

Arguments:

- `count` (integer) - Number of objects to retrieve.

Example:

```javascript
// will only return 5 results
Car.q().where('brand', 'BMW').limit(5)
```

#### `orderBy([field], direction)`

Adds an order by clause to the query. You can add multiple orderBys to your query.

Arguments:

- `field` (string) - Field you are ordering by
- `direction` (string) - `ASC` for ascending, `DESC` for descending. `ASC` is the default value.

Example:

```javascript
// ... ORDER BY brand ASC
Car.q().orderBy('brand')

// ... ORDER BY brand ASC
Car.q().orderBy('brand', 'ASC')

// ... ORDER BY brand DESC
Car.q().orderBy('brand', 'DESC')
```

#### `async first(fields): any`

Returns the first entry from the query results.

Arguments:

- `fields` (string|string[]) - Defaults to `*`. You can specify the fields you want to retrieve, such as:

```javascript
// will run SELECT * FROM ... LIMIT 1
let firstCar = Car.q().first()

// will run SELECT brand FROM ... LIMIT 1
let firstCar = Car.q().first('brand')

// will run SELECT brand, topSpeed as maxSpeed FROM ... LIMIT 1
let firstCar = Car.q().first(['brand', 'topSpeed as maxSpeed']) 

// will run SELECT * FROM ... WHERE brand IN ['BMW', 'Honda'] ... LIMIT 1
let firstCar = Car.q().whereIn('brand', ['BMW', 'Honda']).first()
```

#### `async count(field): number`

Returns the count of entries matching the query results.

Arguments:

- `field` (string|string[]) - Defaults to `docType`. You can specify the fields you want to retrieve, such as:

```javascript
// will run SELECT COUNT(docType) as count FROM ...
Car.q().count()

// will run SELECT COUNT(brand) as count FROM ...
Car.q().count('brand')
```

#### `async get(fields): any[]`

Executes a query. Call this method at the **end of your query chain**. Returns a promise with an array of mapped instances.

Arguments:

- `fields` (string|string[]) - Defaults to `*`. You can specify the fields you want to retrieve, such as:


```javascript
// will run SELECT * FROM ...
let results = Car.q().get()

// will run SELECT * FROM ... WHERE brand IN ['BMW', 'Honda'] ...
let results = Car.q().whereIn('brand', ['BMW', 'Honda']).get()
```

#### `async all(fields): any[]`

Provides all entries.

Arguments:

- `fields` (string|string[]) - Defaults to `*`. You can specify the fields you want to retrieve, such as:

```javascript
// will run SELECT * FROM ...
Car.q().all()

// will run SELECT brand FROM ...
Car.q().all('brand')

// will run SELECT brand, topSpeed as maxSpeed FROM ...
Car.q().all(['brand', 'topSpeed as maxSpeed']) 
```

#### `async paginate(perPage, pageNumber, fields)`

Paginates the results depending on the perPage count and page number.

Arguments:

- `perPage` (number) - Number of entries to be retrieved per page. Defaults to `15`
- `pageNumber` (number) - Page number. Defaults to `1`
- `fields` (string|string[]) - Defaults to `*`. You can specify the fields you want to retrieve, such as:

```javascript
// will run SELECT * FROM ... OFFSET 0 LIMIT 15
let results = Car.q().paginate()

// will run SELECT brand, topSpeed FROM ... OFFSET 10 LIMIT 10
let results = Car.q().paginate(10, 2, ['brand', 'topSpeed'])
```

### Model

To create a Model, you need to have a defined Schema first.

```javascript
// Define a new schema for a Car.
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  color: Type.string()
})

// Build a Model from the Schema.
const Car = settee.buildModel(CarSchema)
```

The `Car` constant can now utilize Model methods scoped to the Car document type. 


**Available methods:**

#### `async create([data])`

Creates a new mapped instance, and *inserts* the `data` as a single entry in the database.

Arguments:

- `data` (Object) - Data to be inserted. The data will be validated against the Schema layout to prevent Type mismatch and invalid values.

Example:

```javascript
let bmw = Car.create({
  brand: 'BMW',
  color: 'blue'
})  
```

#### `addMethods([methods])`

Adds custom methods to the model.

Arguments:

- `methods` (Object) - Object containing custom functions to be added.

Example:

```javascript
Car.addMethods({
  findFastestCars () {
    // 'this' context is bound to the model
    return this.q()
      .where('topSpeed', '>', 190)
      .orderBy('topSpeed', 'DESC')
      .limit(10)
      .get()
  }
})

// now you can call
let fastestCars = await Car.findFastestCars()
```

#### `addInstanceMethods([methods])`

Adds custom methods to the instance.

Arguments:

- `methods` (Object) - Object containing custom functions to be added.

Example:

```javascript
// assume we have a person model, with firstName and lastName
Person.addInstanceMethods({
  getFullName () {
    // 'this' context is bound to the instance
    return this.firstName + ' ' + this.lastName
  }
})

// now you can call this
let joe = await Person.create({
  firstName: 'Joe',
  lastName: 'Something'
})

joe.getFullName() // Joe Something
```

#### `async rawQuery([query], bindings, options): Array<{}>`

Executes a raw query.

Arguments:

- `query` (string) - N1QL query
- `bindings` (Object) - an object containing bindings
- `options` (Object) - an object containing additional options

Example:

```javascript
let entries = await Car.rawQuery(
  'SELECT * FROM `default` WHERE `brand` = $brand',
  bindings: {
    brand: 'BMW'
  }
)
```

#### `async findRawByKey([key])`

Provides a single Couchbase entry by its key.

Arguments:

- `key` (string) - Raw key of the entry. Consists of `docType`, `separator (::)` and `docId`

Example:

```javascript
let car = await Car.findRawByKey('Car::123')
```

#### `async findById([id])`

Provides a mapped instance by ID.

Arguments:

- `id` (string) - `docId` of the entry

Example:

```javascript
let car = await Car.findById('123')
```

#### `async findMatchingKeys([keys])`

Provides multiple Couchbase entries by their keys.

Arguments:

- `key` (string[]) - Array of raw keys of the entries. The key for individual entries consists of `docType`, `separator (::)` and `docId`

Example:

```javascript
let cars = await Car.findMatchingKeys(['Car::123', 'Car::456'])
```

#### `async findMatchingIds([ids])`

Provides multiple mapped instances by their IDs.

Arguments:

- `id` (string[]) - Array of entries with their `docId`

Example:

```javascript
let cars = await Car.findMatchingIds(['123', '456'])
```

#### `async deleteById([id])`

Deletes a Couchbase entry by ID.

Arguments:

- `id` (string) - `docId` of the entry

Example:

```javascript
await Car.deleteById('123')
```

### Mapped Instance

To access the Instance methods, you need to have access to a model:

```javascript
// Create a new schema for a Car.
const CarSchema = new Schema('Car', {
  brand: Type.string(),
  color: Type.string()
})

// Build a Model from Schema. 
const Car = settee.buildModel(CarSchema)

let bmw = Car.create({
  brand: 'BMW',
  color: 'blue'
})
```

The `bmw` variable can now utilize an instance class methods. 

> Note: QueryBuilder methods `get()` and `all()` also return an array of instances, while `first()` will return a single instance.

**Available methods**:

#### `getId()`

Provides instance ID (UUID).

Example:

```javascript
bmw.getId() // 123
```

#### `getType()`

Provides instance type (derived from Schema name).

Example:

```javascript
bmw.getType() // 'Car'
```


#### `getKey()`

Provides instance key.

Example:

```javascript
bmw.getKey() // 'Car::123'
```

#### `getCas()`

Provides instance [CAS](https://developer.couchbase.com/documentation/server/4.6/sdk/concurrent-mutations-cluster.html#concept_iq4_bts_zs).

#### `async save(): boolean`

Saves the changed instance. Changes on the instance will be validated against the Schema layout to prevent Type mismatch and invalid values.

Example:

```javascript
bmw.color // 'blue'

// respray to a hot pink color
bmw.color = 'hot pink'
await bmw.save()

bmw.color // 'hot pink'
```

#### `async delete()`

Deletes the instance, and respective entry bound to the instance from the database.

Example:

```javascript
await bmw.delete() // deleted!
```

#### `getData()`

Provides the latest data of the instance.

Example:

```javascript
// Will be an object with these properties
// docId: 123
// docType: 'Car'
// brand: 'BMW'
// color: 'blue'

let bmwData = bmw.getData()
```

## Team

[![Rudolf Halas](https://avatars2.githubusercontent.com/u/5157177?v=3&s=150)](https://github.com/hrcc) | [![Jakub Homoly](https://avatars1.githubusercontent.com/u/9151969?v=3&s=150)](https://github.com/insanesvk)
---|---|
[Rudolf Halas](https://github.com/hrcc) | [Jakub Homoly](https://github.com/insanesvk)

## Contributing

Thanks for your interest in Settee! If you'd like to contribute, please read our [contribution guide](contribution.md).

## License

Settee is open-sourced software licensed under the ISC license. If you'd like to read the license agreement, click [here](LICENSE).
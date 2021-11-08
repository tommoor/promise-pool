[![npm version](https://badge.fury.io/js/async-promise-pool.svg)](https://badge.fury.io/js/async-promise-pool) [![CircleCI](https://circleci.com/gh/tommoor/promise-pool.svg?style=svg)](https://circleci.com/gh/tommoor/promise-pool)

# Promise Pool

Promise pool is a small, dependency free, library to manage the
concurrent resolution of any number of promises. It is particularly useful
when the promises are not all available upfront.

## Options

Options are passed to the `PromisePool` constructor:
```javascript
const PromisePool = require("async-promise-pool");
const pool = new PromisePool(options);
```

The `options` object allows you to set the following:

### `concurrency`
Enables you to choose how many promises will run at once

Default: no limit to concurrency (i.e. `Number.MAX_VALUE`)

### `accessIndividualPromises`
If set to `true`, `pool.add()` passes through the passed promise, out to the caller (see example below)

Default: `false`

## Example Usage
```javascript
const PromisePool = require("async-promise-pool");

const pool = new PromisePool({
  // Only allow 3 unresolved promises at a time
  concurrency: 3,

  // Pass through the promise passed to pool.add() to the caller
  accessIndividualPromises: true
});

// elsewhere add functions to the pool that produce promises. We use
// functions here to prevent the promises from immediately executing.
const resolvedValue = await pool.add(() => thingThatReturnsAPromise());

// you can await pool.all to ensure that all promises in the pool are
// resolved before continuing.
await pool.all();
```

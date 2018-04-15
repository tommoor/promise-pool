[![CircleCI](https://circleci.com/gh/tommoor/promise-pool.svg?style=svg)](https://circleci.com/gh/tommoor/promise-pool)

# Promise Pool

## Example Usage
```javascript
// concurrency is the only option for PromisePool and enables you to 
// choose how many promises will run at once
const pool = new PromisePool({ concurrency: 3 });

// elsewhere add functions to the pool that produce promises. We use
// functions here to prevent the promises from immediately executing.
pool.add(() => thingThatReturnsAPromise());

// you can await pool.all to ensure that all promises in the pool are 
// resolved before continuing.
await pool.all();
```
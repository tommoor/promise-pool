// @flow
import without from "lodash/without";

type PromiseProducer = () => Promise<*>;
type Deferred = {
  resolve: Function,
  reject: Function,
  promise: Promise<*>
};
type Options = { concurrency?: number };

// see: http://bluebirdjs.com/docs/api/deferred-migration.html
function defer() {
  let resolve = () => {};
  let reject = () => {};
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
}

export default class PromisePool {
  queue: PromiseProducer[] = [];
  pool: Promise<*>[] = [];
  results: *[] = [];
  wait: ?Deferred;
  error: ?Error;
  concurrency: number = Number.MAX_VALUE;

  constructor(options: Options = {}) {
    if (options.concurrency) {
      this.concurrency = options.concurrency;
    }
  }

  next = async () => {
    // If any of the previous promises rejected then we should immediately abort
    // this ensures that if anything failed while being added to the pool then
    // calling pool.all will always result in an error being thrown
    if (this.error) {
      throw this.error;
    }

    // There's nothing left to do if the queue and pool are both empty, we can
    // return the promise results now.
    if (!this.queue.length && !this.pool.length) {
      return this.results;
    }

    // The number of promises running is enough or there are no more promises
    // left to queue up then wait. This avoids a hot-loop.
    if (this.pool.length >= this.concurrency || !this.queue.length) {
      if (!this.wait) this.wait = defer();
      await this.wait.promise;
      return this.next();
    }

    // At this point we have a new promise to run and the concurrency to run it
    const promiseProducer = this.queue.shift();
    const run = async () => {
      const promise = promiseProducer();
      this.pool.push(promise);
      let result;
      try {
        result = await promise;
      } catch (err) {
        this.error = err;
      }

      this.results.push(result);
      this.pool = without(this.pool, promise);

      // every time a promise in the queue is resolved then we need to check if
      // there is anything waiting to be started.
      if (this.wait) {
        const wait = this.wait;
        this.wait = undefined;
        return wait.resolve();
      }
    };

    // run is not awaited otherwise concurrency would never be more than one
    run();
    return this.next();
  };

  add(promiseProducer: PromiseProducer) {
    this.queue.push(promiseProducer);
    this.next();
  }

  all() {
    return this.next();
  }
}

// @flow

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

class PromisePool {
  queue: PromiseProducer[] = [];
  pool: Promise<*>[] = [];
  results: *[] = [];
  final: Deferred;
  error: ?Error;
  concurrency: number = Number.MAX_VALUE;

  constructor(options: Options = {}) {
    if (options.concurrency) {
      this.concurrency = options.concurrency;
    }
    this.final = defer();
  }

  next = async () => {
    // If any of the previous promises rejected then we should immediately abort
    // this ensures that if anything failed while being added to the pool then
    // calling pool.all will always result in an error being thrown
    if (this.error) {
      return this.final.reject(this.error);
    }

    // There's nothing left to do if the queue and pool are both empty, we can
    // return the promise results now.
    if (!this.queue.length && !this.pool.length) {
      return this.final.resolve(this.results);
    }

    // The number of promises running is enough or there are no more promises left to queue up then wait.
    if (this.pool.length >= this.concurrency || !this.queue.length) return;

    // At this point we have a new promise to run and the concurrency to run it
    const promiseProducer = this.queue.shift();

    let result;
    let promise;
    try {
      promise = promiseProducer();
      this.pool.push(promise);
      result = await promise;

      this.results.push(result);
       this.pool = this.pool.filter(p => p !== promise);
    } catch (err) {
      this.error = err;
    }

    return this.next();
  };

  add(promiseProducer: PromiseProducer) {
    this.queue.push(promiseProducer);
    this.next();
  }

  all() {
    return this.final.promise;
  }
}

module.exports = PromisePool;
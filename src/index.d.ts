declare module 'async-promise-pool' {
  type PromiseProducer = () => Promise<any>;
  type Deferred = {
    resolve: (value: any) => void,
    reject: (error: unknown) => void,
    promise: Promise<any>
  };
  type Options = { concurrency?: number };

  class PromisePool {
    queue: PromiseProducer[];
    pool: Promise<any>[];
    results: any[];
    final: Deferred;
    error?: Error;
    concurrency: number;

    constructor(options: Options);

    next(): Promise<any>;
    add(promiseProducer: PromiseProducer): void;
    all(): Promise<any>;
  }

  export default PromisePool;
}

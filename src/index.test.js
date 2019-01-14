const PromisePool = require(".");

describe("PromisePool", () => {
  let promiseSpy;
  let promiseProducer;

  beforeEach(() => {
    promiseSpy = jest.fn();
    promiseProducer = () =>
      new Promise((resolve, reject) => {
        promiseSpy();
        resolve("success");
      });
  });

  it("should await all promises", async () => {
    const pool = new PromisePool();
    pool.add(promiseProducer);
    pool.add(promiseProducer);
    const results = await pool.all();
    expect(promiseSpy).toHaveBeenCalledTimes(2);
    expect(results.length).toBe(2);
  });

  it("should await all promises with no concurrency", async () => {
    const pool = new PromisePool({ concurrency: 1 });
    pool.add(promiseProducer);
    pool.add(promiseProducer);
    pool.add(promiseProducer);
    const results = await pool.all();
    expect(promiseSpy).toHaveBeenCalledTimes(3);
    expect(results.length).toBe(3);
  });

  it("should allow multiple concurrency", async () => {
    const delayedPromiseSpy = jest.fn();
    const delayedPromiseProducer = () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          delayedPromiseSpy();
          resolve("delayed");
        }, 1000);
      });

    const pool = new PromisePool({ concurrency: 2 });
    pool.add(delayedPromiseProducer);
    pool.add(promiseProducer);
    const results = await pool.all();
    expect(delayedPromiseSpy).toBeCalled();
    expect(promiseSpy).toBeCalled();
    expect(results[0]).toBe("success");
    expect(results[1]).toBe("delayed");
  });

  it("can be called multiple times", async () => {
    const pool = new PromisePool({ concurrency: 2 });
    pool.add(promiseProducer);
    await pool.all();
    pool.add(promiseProducer);
    pool.add(promiseProducer);
    const results = await pool.all();
    expect(promiseSpy).toHaveBeenCalledTimes(3);
    expect(results.length).toBe(3);
  });

  it("should throw if .all fails", async () => {
    const pool = new PromisePool({ concurrency: 2 });
    let error;
    let errorProducer = () =>
      new Promise((resolve, reject) => {
        reject(new Error("Test"));
      });

    try {
      pool.add(promiseProducer);
      pool.add(promiseProducer);
      pool.add(errorProducer);
      await pool.all();
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe("Test");
  });

  it("should throw if any promise fails outside of .all", async () => {
    const pool = new PromisePool({ concurrency: 2 });
    let error;
    let errorProducer = () =>
      new Promise((resolve, reject) => {
        reject(new Error("Test"));
      });

    pool.add(promiseProducer);
    pool.add(promiseProducer);
    pool.add(errorProducer);
    try {
      await pool.all();
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe("Test");
  });
});

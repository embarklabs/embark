import assert from 'assert';
import sinon from 'sinon';
import { fakeEmbark } from 'embark-testing';

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["assert", "expect"] }] */

describe('core/logger', () => {

  const { embark } = fakeEmbark();

  let logger, testLogFn, resolve;
  const logFile = 'embark.log';

  const fsMock = {
    logs: {},
    appendFile: (file, content, callback) => {
      fsMock.logs[file].push(content);
      if (resolve) resolve();
      callback();
    },
    ensureFileSync: (file) => {
      if (!fsMock.logs[file]) {
        fsMock.logs[file] = [];
      }
    }
  };

  let Logger;
  beforeAll(() => {
    process.env.FORCE_COLOR = '1';
    // load the module only after the environment variable is set, otherwise
    // the colors package will already have been loaded and in CI the result
    // will be that colors are disabled and tests below will fail
    ({Logger} = require('../src'));
  });

  afterAll(() => {
    delete process.env.FORCE_COLOR;
  });

  beforeEach(() => {
    fsMock.logs[logFile] = [];
    resolve = null;
    testLogFn = sinon.fake();
    logger = new Logger({
      events: embark.events,
      logFile,
      logFunction: testLogFn,
      fs: fsMock
    });
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  test('it should use custom log function for logging', async () => {
    const promise = new Promise(res => { resolve = res; });
    logger.info('Hello world');
    assert(testLogFn.calledOnce);
    await promise;
  });

  test('it should inject color encoding based on log method', async () => {
    logger.info('Hello world');
    assert(testLogFn.calledWith('\u001b[32mHello world\u001b[39m'));
    logger.warn('Hello world');
    assert(testLogFn.calledWith('\u001b[33mHello world\u001b[39m'));
    const promise = new Promise(res => { resolve = res; });
    logger.error('Hello world');
    assert(testLogFn.calledWith('\u001b[31mHello world\u001b[39m'));
    await promise;
  });

  test('it should write logs to log file', async () => {
    const promise = new Promise(res => { resolve = res; });
    logger.info('Some test log');
    await promise;
    assert(fsMock.logs[logFile].some(
      entry => entry.includes('[info]  Some test log')
    ));
  });

  test('it should not log if log method level is higher than configured log level', async () => {
    logger.trace('Hello world');
    // default log level is `info` which is lower than `trace`
    assert.ok(!testLogFn.calledOnce);
    const promise = new Promise(res => { resolve = res; });
    logger.warn('Test');
    assert.ok(testLogFn.calledOnce);
    await promise;
  });
});

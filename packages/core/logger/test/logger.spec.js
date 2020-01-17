import assert from 'assert';
import sinon from 'sinon';
import * as fs from 'fs';
import { fakeEmbark } from 'embark-testing';
import { Logger } from '../src/';
import tmp from 'tmp';

describe('core/logger', () => {

  const { embark, plugins } = fakeEmbark();

  let logger, testLogFn, logFile;

  const fsMock = {
    logs: {},
    appendFile: (file, content, callback) => {
      if (!fsMock.logs[file]) {
        fsMock.logs[file] = [];
      }
      fsMock.logs[file].push(content);
      callback();
    }
  };

  beforeEach(() => {
    logFile = tmp.fileSync();
    fsMock[logFile.name] = [];

    testLogFn = sinon.fake();
    logger = new Logger({
      events: embark.events,
      logFunction: testLogFn,
      logFile: logFile.name,
      fs: fsMock
    });
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  test('it should use custom log function for logging', () => {
    logger.info('Hello world');
    assert(testLogFn.calledOnce);
  });

  test('it should inject color encoding based on log method', () => {
    logger.info('Hello world');
    assert(testLogFn.calledWith('\u001b[32mHello world\u001b[39m'));
    logger.warn('Hello world');
    assert(testLogFn.calledWith('\u001b[33mHello world\u001b[39m'));
    logger.error('Hello world');
    assert(testLogFn.calledWith('\u001b[31mHello world\u001b[39m'));
  });

  test('it should write logs to log file', (done) => {
    const stats = fs.statSync(logFile.name);
    logger.info('Some test log', () => {
      fsMock.logs[logFile.name].forEach(entry => {
        if (entry.indexOf('[info]:  Some test log') > -1) {
          assert.ok(true);
        }
      });
      done();
    });
  });

  test('it should not log if log method level is higher than configured log level', () => {
    logger.trace('Hello world');
    // default log level is `info` which is lower than `trace`
    assert.ok(!testLogFn.calledOnce);
    logger.warn('Test');
    assert.ok(testLogFn.calledOnce);
  });
});

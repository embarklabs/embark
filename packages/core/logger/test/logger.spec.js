import assert from 'assert';
import sinon from 'sinon';
import * as fs from 'fs';
import { fakeEmbark } from 'embark-testing';
import { Logger } from '../src/';
import tmp from 'tmp';

describe('core/logger', () => {

  const { embark, plugins } = fakeEmbark();

  let logger, testLogFn, logFile;

  beforeEach(() => {
    logFile = tmp.fileSync();

    testLogFn = sinon.fake();
    logger = new Logger({
      events: embark.events,
      logFunction: testLogFn,
      logFile: logFile.name
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

  test('it should write logs to log file', () => {
    logger.info('Some test log');
    const logs = fs.readFileSync(logFile.name, 'utf8')
    assert.ok(logs.indexOf('[info]:  Some test log') > -1);
  });

  test('it should not log if log method level is higher than configured log level', () => {
    logger.trace('Hello world');
    // default log level is `info` which is lower than `trace`
    assert.ok(!testLogFn.calledOnce);
    logger.warn('Test');
    assert.ok(testLogFn.calledOnce);
  });
});

/*global describe, it, before, beforeEach*/
const assert = require('assert');
const sinon = require('sinon');
const TestLogger = require('../lib/tests/test_logger');
const path = require('path');
const ProcessLauncher = require('../lib/processes/processLauncher');

describe('ProcessWrapper', () => {
  let processLauncher;

  before(() => {
    sinon.stub(ProcessLauncher.prototype, '_subscribeToMessages');
    processLauncher = new ProcessLauncher({
      logger: new TestLogger({}),
      modulePath: path.join(__dirname, 'test.js')
    });
  });

  describe('on', () => {

    beforeEach(() => {
      processLauncher.subscriptions = {};
    });

    it('should create an array for the key value', function () {
      processLauncher.on('test', 'value', 'myCallback');
      assert.deepEqual(processLauncher.subscriptions, {
        "test": [
          {
            "callback": "myCallback",
            "value": "value"
          }
        ]
      });
    });

    it('should add another value to the key', () => {
      processLauncher.on('test', 'value', 'myCallback');
      processLauncher.on('test', 'value2', 'myCallback2');
      assert.deepEqual(processLauncher.subscriptions, {
        "test": [
          {
            "callback": "myCallback",
            "value": "value"
          },
          {
            "callback": "myCallback2",
            "value": "value2"
          }
        ]
      });
    });
  });

  describe('unsubscribeTo', () => {
    it('should remove the value for the key', () => {
      processLauncher.subscriptions = {
        "test": [
          {
            "callback": "myCallback",
            "value": "value"
          },
          {
            "callback": "myCallback2",
            "value": "value2"
          }
        ]
      };

      processLauncher.unsubscribeTo('test', 'value2');
      assert.deepEqual(processLauncher.subscriptions, {
        "test": [
          {
            "callback": "myCallback",
            "value": "value"
          }
        ]
      });
    });

    it('should remove the whole key', () => {
      processLauncher.subscriptions = {
        "test": [
          {
            "callback": "myCallback",
            "value": "value"
          }
        ]
      };

      processLauncher.unsubscribeTo('test');
      assert.deepEqual(processLauncher.subscriptions, {test: []});
    });
  });

  describe('unsubscribeToAll', () => {
    it('clears every subscriptions', () => {
      processLauncher.subscriptions = {
        "test": [
          {
            "callback": "myCallback",
            "value": "value"
          }
        ]
      };

      processLauncher.unsubscribeToAll();
      assert.deepEqual(processLauncher.subscriptions, {});
    });
  });

  describe('_checkSubscriptions', function () {
    it('should not do anything if not in subscription', function () {
      const callback = sinon.stub();
      processLauncher.subscriptions = {
        "test": [
          {
            "callback": callback,
            "value": "value"
          }
        ]
      };
      processLauncher._checkSubscriptions({does: 'nothing', for: 'real'});
      assert.strictEqual(callback.callCount, 0);
    });

    it('should call the callback', function () {
      const callback = sinon.stub();
      processLauncher.subscriptions = {
        "test": [
          {
            "callback": callback,
            "value": "value"
          }
        ]
      };
      processLauncher._checkSubscriptions({test: 'value'});
      assert.strictEqual(callback.callCount, 1);
    });

    it('should call the callback and remove the sub', function () {
      const callback = sinon.stub();
      processLauncher.subscriptions = {
        "test": [
          {
            "callback": callback,
            "value": "value",
            "once": true
          }
        ]
      };
      processLauncher._checkSubscriptions({test: 'value'});
      assert.strictEqual(callback.callCount, 1);
      assert.deepEqual(processLauncher.subscriptions, {test: []});
    });

    it('should call the callback twice', function () {
      const callback = sinon.stub();
      processLauncher.subscriptions = {
        "test": [
          {
            "callback": callback,
            "value": "value"
          },
          {
            "callback": callback,
            "value": "value"
          }
        ]
      };
      processLauncher._checkSubscriptions({test: 'value'});
      assert.strictEqual(callback.callCount, 2);
    });
  });
});

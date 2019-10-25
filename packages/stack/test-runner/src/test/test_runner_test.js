const assert = require('assert').strict;
const refute = require('refute')(assert);
const sinon = require('sinon');

const {fakeEmbark} = require('embark-testing');

const TestRunner = require('../lib/index.js');

describe('Test Runner', () => {
  let _embark;
  let instance;

  beforeEach(() => {
    const { embark } = fakeEmbark({ contractsConfig: {} });
    embark.events.setCommandHandler('config:contractsConfig:set', (config, cb) => {
      embark.config.contractsConfig = config;
      cb(null);
    });
    _embark = embark;
    instance = new TestRunner(embark, {stdout: {write: () => {}}});
  });

  describe('command handlers', () => {
    describe('tests:run', () => {
      let first, second;

      beforeEach(() => {
        first = {
          pluginName: 'first',
          matchFn: sinon.fake(path => path === 'test/file_first.js'),
          addFn: sinon.fake(),
          runFn: sinon.fake.yields()
        };

        second = {
          pluginName: 'second',
          matchFn: sinon.fake(path => path === 'test/file_second.js'),
          addFn: sinon.fake(),
          runFn: sinon.fake.yields()
        };

        instance.runners = [first, second];

        instance.getFilesFromDir = (_, cb) => {
          cb(null, ['test/file_first.js', 'test/file_second.js']);
        };
      });

      it('should warn when a file does not match any plugins', (done) => {
        instance.getFilesFromDir = (_, cb) => {
          cb(null, ['luri.js']);
        };

        instance.run({}, (err) => {
          // Ensure no error was returned
          refute(err);

          sinon.assert.calledWith(first.matchFn, 'luri.js');
          sinon.assert.calledWith(second.matchFn, 'luri.js');

          // Ensure that we logged
          _embark.assert.logged('warn', /luri.js/);

          done();
        });
      });

      it('should add the correct files to the correct plugins', (done) => {
        instance.run({}, (err) => {
          // Ensure no error was returned
          refute(err);

          // Ensure that we didn't warn that runners weren't registered.
          sinon.assert.notCalled(_embark.logger.warn);

          // Ensure plugins received the correct files
          sinon.assert.calledWith(first.addFn, 'test/file_first.js');
          sinon.assert.neverCalledWith(second.addFn, 'test/file_first.js');
          sinon.assert.calledWith(second.addFn, 'test/file_second.js');
          sinon.assert.neverCalledWith(first.addFn, 'test/file_second.js');

          done();
        });
      });

      it('should run registered plugins in order', (done) => {
        instance.run({}, (err) => {
          // Ensure no error was returned
          refute(err);

          // Ensure plugins are called in order
          sinon.assert.callOrder(first.runFn, second.runFn);

          done();
        });
      });

      it('should not keep going if a plugin raises an error', (done) => {
        first.runFn = sinon.fake.yields('some error');

        instance.run({}, (err) => {
          // Ensure an error was returned
          assert.equal('some error', err);

          // Ensure only first plugin got called
          sinon.assert.calledOnce(first.runFn);
          sinon.assert.notCalled(second.runFn);

          done();
        });
      });

      it('callback receives number of passes and failures', (done) => {
        first.runFn = sinon.spy(({reporter}, cb) => {
          reporter.report('first test #1', 0.01, true);
          reporter.report('first test #2', 0.01, true);
          cb();
        });

        second.runFn = sinon.spy(({reporter}, cb) => {
          reporter.report('second test #1', 0.01, true);
          reporter.report('second test #2', 0.01, false, 'failed assertion');
          cb();
        });

        instance.run({}, (err, passes, failures) => {
          // Ensure no error was returned
          refute(err);

          // Ensure we get the correct reported passes and fails
          assert.equal(3, passes);
          assert.equal(1, failures);

          done();
        });
      });
    });
  });
});

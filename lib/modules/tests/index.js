const async = require('async');
const Mocha = require('mocha');
const path = require('path');
const {runCmd} = require('../../utils/utils');
const fs = require('../../core/fs');
const assert = require('assert');
const Test = require('./test');
const EmbarkSpec = require('./reporter');
const SolcTest = require('./solc_test');
const constants = require('../../constants');

class TestRunner {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.ipc = options.ipc;

    this.events.setCommandHandler('tests:run', (options, callback) => {
      this.run(options, callback);
    });
  }

  run(options, cb) {
    const self = this;
    let filePath = options.file;
    if (!filePath) {
      filePath = 'test';
    }
    async.waterfall([
      function getFiles(next) {
        self.getFilesFromDir(filePath, next);
      },
      function groupFiles(files, next) {
        let jsFiles = files.filter((filename) => filename.substr(-3) === '.js');
        let solidityFiles = files.filter((filename) => filename.indexOf('_test.sol') > 0);
        next(null, {jsFiles, solidityFiles});
      },
      function runTests(files, next) {
        const fns = [];
        if (!options.solc && files.jsFiles.length > 0) {
          let fn = (callback) => {
            self.runJSTests(files.jsFiles, options, callback);
          };
          fns.push(fn);
        }
        if(files.solidityFiles.length > 0) {
          let fn = (callback) => {
            self.runSolidityTests(files.solidityFiles, options, callback);
          };
          fns.push(fn);
        }
        if(fns.length === 0){
          return next('No tests to run');
        }
        async.series(fns, next);
      },
      function runCoverage(results, next) {
        if (!options.coverage) {
          return next(null, results);
        }

        global.embark.events.emit('tests:finished', function() {
          runCmd(`${fs.embarkPath('node_modules/.bin/istanbul')} report --root .embark --format html`,
            {silent: false, exitOnError: false}, (err) => {
              if (err) {
                return next(err);
              }
              console.info(`Coverage report created. You can find it here: ${fs.dappPath('coverage/__root__/index.html')}\n`);
              const opn = require('opn');
              const _next = () => { next(null, results); };
              if (options.noBrowser) {
                return next(null, results);
              }
              opn(fs.dappPath('coverage/__root__/index.html'), {wait: false})
                .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
                .then(_next, _next);
            });
        });
      }
    ], (err, results) => {
      if (err) {
        self.logger.error(err);
        return cb(err);
      }
      let totalFailures = results.reduce((acc, result) => acc + result.failures, 0);
      if (totalFailures) {
        return cb(` > Total number of failures: ${totalFailures}`.red.bold);
      }
      console.info(' > All tests passed'.green.bold);
      cb();
    });
  }


  getFilesFromDir(filePath, cb) {
    const self = this;

    fs.stat(filePath, (err, fileStat) => {
      const errorMessage = `File "${filePath}" doesn't exist or you don't have permission to it`.red;
      if (err) {
        return cb(errorMessage);
      }
      let isDirectory = fileStat.isDirectory();
      if (isDirectory) {
        return fs.readdir(filePath, (err, files) => {
          if (err) {
            return cb(err);
          }
          async.map(files, (file, _cb) => {
            self.getFilesFromDir(path.join(filePath, file), _cb);
          }, (err, arr) => {
            if (err) {
              return cb(errorMessage);
            }
            cb(null, arr.reduce((a,b) => a.concat(b), []));
          });
        });
      }
      cb(null, [filePath]);
    });
  }

  runJSTests(files, options, cb) {
    const self = this;
    async.waterfall([
      function setupGlobalNamespace(next) {
        const test = new Test({loglevel: options.loglevel, node: options.node, events: self.events, logger: self.logger,
          config: self.embark.config, ipc: self.ipc});
        global.embark = test;
        global.assert = assert;
        global.config = test.config.bind(test);

        let deprecatedWarning = function () {
          self.logger.error(__('%s are not supported anymore', 'EmbarkSpec & deployAll').red);
          self.logger.error(__('You can learn about the new revamped tests here: %s', 'https://embark.status.im/docs/testing.html'.underline));
          process.exit();
        };

        global.deployAll = deprecatedWarning;
        global.EmbarkSpec = {};
        global.EmbarkSpec.deployAll = deprecatedWarning;

        // Override require to enable `require('Embark/contracts/contractName');`
        const Module = require('module');
        const originalRequire = require('module').prototype.require;
        Module.prototype.require = function (requireName) {
          if (requireName.startsWith('Embark/contracts')) {
            return test.require(...arguments);
          }
          return originalRequire.apply(this, arguments);
        };

        global.contract = function (describeName, callback) {
          return Mocha.describe(describeName, callback);
        };

        test.init((err) => {
          next(err, files);
        });
      },
      function executeForAllFiles(files, next) {
        let fns = files.map((file) => {
          return (cb) => {
            const mocha = new Mocha();
            mocha.reporter(EmbarkSpec, {
              events: self.events,
              gasDetails: options.gasDetails,
              gasLimit: constants.tests.gasLimit
            });

            mocha.addFile(file);
            mocha.suite.timeout(0);
            mocha.suite.beforeAll('Wait for deploy', (done) => {
              if (global.embark.needConfig) {
                global.config({});
              }
              global.embark.onReady((err) => {
                done(err);
              });
            });
            mocha.run(function (fails) {
              mocha.suite.removeAllListeners();
              // Mocha prints the error already
              cb(null, fails);
            });
          };
        });
        async.series(fns, next);
      }
    ], (err, runs) => {
      if(err) {
        return cb(err);
      }
      let failures = runs.reduce((acc, val) => acc + val, 0);
      fs.remove('.embark/contracts', (_err) => {
        cb(null, {failures});
      });
    });
  }

  runSolidityTests(files, options, cb) {
    console.info('Running solc tests');

    let solcTest = new SolcTest({loglevel: options.loglevel, node: options.node, events: this.events, logger: this.logger,
      config: this.embark.config, ipc: this.ipc});
    global.embark = solcTest;
    async.waterfall([
      function initEngine(next) {
        solcTest.init(next);
      },
      function setupTests(next) {
        solcTest.setupTests(files, next);
      },
      function runTests(_reciepts ,cb) {
        let fns = files.map((file) => {
          return (cb) => {
            return solcTest.runTests(file, cb);
          };
        });
        async.series(fns, cb);
      }
    ], (err, results) => {
      if(err) return cb(err);
      let totalPass = 0;
      let totalFailures = 0;
      results.forEach((result) => {
        result.forEach((r) => {
          totalPass = totalPass + r.passingNum;
          totalFailures = totalFailures + r.failureNum;
        });
      });
      cb(null, {failures: totalFailures, pass: totalPass});
    });
  }
}

module.exports = TestRunner;

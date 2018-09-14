const async = require('async');
const Mocha = require('mocha');
const path = require('path');
const {runCmd} = require('../utils/utils');
const fs = require('../core/fs');
const assert = require('assert');
const Test = require('./test');
const EmbarkSpec = require('./reporter');

function getFilesFromDir(filePath, cb) {
  fs.readdir(filePath, (err, files) => {
    if (err) {
      return cb(err);
    }
    const testFiles = files.map((file) => {
      return path.join(filePath, file);
    });
    cb(null, testFiles);
  });
}

function runJSTests(files, options, cb) {
  const loglevel = options.loglevel || 'warn';
  async.waterfall([
    function setupGlobalNamespace(next) {
      // TODO put default config
      const test = new Test({loglevel, node: options.node});
      global.embark = test;
      global.assert = assert;
      global.config = test.config.bind(test);

      let deprecatedWarning = function () {
        console.error(__('%s are not supported anymore', 'EmbarkSpec & deployAll').red);
        console.info(__('You can learn about the new revamped tests here: %s', 'https://embark.status.im/docs/testing.html'.underline));
        process.exit();
      };

      global.deployAll = deprecatedWarning;
      global.EmbarkSpec = {};
      global.EmbarkSpec.deployAll = deprecatedWarning;

      // Override require to enable `require('Embark/contracts/contractName');`
      const Module = require('module');
      const originalRequire = require('module').prototype.require;
      Module.prototype.require = function (requireName) {
        if (requireName.startsWith('Embark')) {
          return test.require(...arguments);
        }
        return originalRequire.apply(this, arguments);
      };

      // TODO: this global here might not be necessary at all
      global.web3 = global.embark.web3;

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
            events: global.embark.engine.events,
            gasDetails: options.gasDetails,
            gasLimit: 6000000
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
      cb(null, {jsTests : {failures}, name: 'jsTests'});
    });
  });
}

function runSolidityTests(cb) {

}


module.exports = {
  run: function (options) {
    let filePath = options.file;
    if (!filePath) {
      filePath = 'test/';
    }

    async.waterfall([
      function checkIfDir(next) {
        if (filePath.substr(-1) === '/') {
          return next(null, null);
        }
        fs.stat(filePath, (err, stats) => {
          if (err) {
            return next(`File "${filePath}" doesn't exist or you don't have permission to it`.red);
          }
          if (stats.isDirectory()) {
            return next(null, null);
          }
          next(null, [filePath]);
        });
      },
      function getFiles(files, next) {
        if (files) {
          return next(null, files);
        }
        getFilesFromDir(filePath, (err, files) => {
          if (err) {
            console.error('Error while reading the directory');
            return next(err);
          }
          let jsFiles = files.filter((filename) => filename.substr(-3) === '.js');
          let solidityFiles = files.filter((filename) => filename.indexOf('_test.sol') > 0);
          next(null, {jsFiles, solidityFiles});
        });
      },
      function(files, next) {
        const fns = [];
        if (!options.solc && files.jsFiles.length > 0) {
          let fn = (callback) => {
            runJSTests(files.jsFiles, options, callback);
          };
          fns.push(fn);
        }
        if(files.solidityFiles.length > 0) {
          let fn = (callback) => {
            runSolidityTests(files.solidityFiles, callback);
          };
          fns.push(fn);
        }
        if(fns.length === 0){
          return next('No tests to run');
        }
        async.series(fns, next);
      }

    ], (err, results) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      let totalFailures = 0;
      results.forEach((result) => {
        let failures = result[result.name].failures;
        totalFailures = totalFailures + failures;
        if (failures) {
          console.error(` > Total number of failures: ${failures}`.red.bold);
        } else {
          console.log(' > All tests passed'.green.bold);
        }
      });
      process.exit(totalFailures);
    });
  }
};

const async = require('async');
const fs = require('fs-extra');
const Mocha = require('mocha');
const path = require('path');
const assert = require('assert');
const Test = require('./test');

function getFilesFromDir(filePath, cb) {
  fs.readdir(filePath, (err, files) => {
    if (err) {
      return cb(err);
    }
    const testFiles = files.filter((file) => {
      // Only keep the .js files
      // TODO: make this a configuration in embark.json
      return file.substr(-3) === '.js';
    }).map((file) => {
      return path.join(filePath, file);
    });
    cb(null, testFiles);
  });
}

module.exports = {
  run: function (filePath) {
    process.env.isTest = true;
    let failures = 0;
    if (!filePath) {
      filePath = 'test/';
    }

    async.waterfall([
      function setupGlobalNamespace(next) {
        // TODO put default config
        const test = new Test();
        global.embark = test;
        global.assert = assert;
        global.config = test.config.bind(test);

        // Override require to enable `require('Embark/contracts/contractName');`
        const Module = require('module');
        const originalRequire = require('module').prototype.require;
        Module.prototype.require = function(requireName) {
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

        console.info('Compiling contracts'.cyan);
        test.init(next);
      },
      function getFiles(next) {
        if (filePath.substr(-1) !== '/') {
          return next(null, [filePath]);
        }
        getFilesFromDir(filePath, (err, files) => {
          if (err) {
            console.error('Error while reading the directory');
            return next(err);
          }
          next(null, files);
        });
      },
      function executeForAllFiles(files, next) {
        async.eachLimit(files, 1, (file, eachCb) => {
          const mocha = new Mocha();
          mocha.addFile(file);

          mocha.suite.timeout(0);
          mocha.suite.beforeEach('Wait for deploy', (done) => {
            global.embark.onReady(() => {
              done();
            });
          });

          mocha.run(function(fails) {
            failures += fails;
            // Mocha prints the error already
            eachCb();
          });
        }, next);
      }
    ], (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      if (failures) {
        console.error(` > Total number of failures: ${failures}`.red.bold);
      } else {
        console.log(' > All tests passed'.green.bold);
      }

      // Clean contracts folder for next test run
      fs.remove('.embark/contracts', (_err) => {
        process.exit(failures);
      });
    });
  }
};

const async = require('async');
const fs = require('fs-extra');
const Mocha = require('mocha');
const path = require('path');
const assert = require('assert');
const Test = require('./test');
const EmbarkSpec = require('./reporter');

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
  run: function (options) {
    process.env.isTest = true;
    let failures = 0;
    let filePath = options.file;
    const loglevel = options.loglevel || 'warn';
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
          next(null, files);
        });
      },
      function setupGlobalNamespace(files, next) {
        // TODO put default config
        const test = new Test({loglevel});
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

        console.info('Compiling contracts'.cyan);
        test.init((err) => {
          next(err, files);
        });
      },
      function executeForAllFiles(files, next) {
        async.eachLimit(files, 1, (file, eachCb) => {
          const mocha = new Mocha();
          mocha.reporter(EmbarkSpec, {events: global.embark.engine.events, gasDetails: options.gasDetails});
          mocha.addFile(file);

          mocha.suite.timeout(0);

          mocha.suite.beforeAll('Wait for deploy', (done) => {
            global.embark.onReady((err) => {
              done(err);
            });
          });

          mocha.run(function (fails) {
            failures += fails;
            mocha.suite.removeAllListeners();
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

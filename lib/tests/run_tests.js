const async = require('async');
const fs = require('fs-extra');
const Mocha = require('mocha');
const path = require('path');
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
    const mocha = new Mocha();
    if (!filePath) {
      filePath = 'test/';
    }

    async.waterfall([
      function getFiles(next) {
        if (filePath.substr(-1) !== '/') {
          mocha.addFile(filePath);
          return next();
        }
        getFilesFromDir(filePath, (err, files) => {
          if (err) {
            console.error('Error while reading the directory');
            return next(err);
          }
          files.forEach(file => {
            mocha.addFile(file);
          });
          next();
        });
      },
      function setupGlobalNamespace(next) {
        // TODO put default config
        const test = new Test();
        global.embark = test;
        global.config = test.config.bind(test);

        // TODO: this global here might not be necessary at all
        global.web3 = global.embark.web3;

        mocha.suite.beforeEach('Wait for deploy', (done) => {
          test.onReady(() => {
            done();
          });
        });
        global.contract = function (describeName, callback) {
          return Mocha.describe(describeName, callback);
        };

        test.init(next);
      }
    ], (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      // Run the tests.
      mocha.run(function (failures) {
        // Clean contracts folder for next test run
        fs.remove('.embark/contracts', (_err) => {
          process.on('exit', function () {
            process.exit(failures);  // exit with non-zero status if there were failures
          });
          process.exit();
        });
      });
    });
  }
};

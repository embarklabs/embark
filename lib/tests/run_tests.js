const async = require('async');
const fs = require('fs-extra');
const Mocha = require('mocha');
const path = require('path');
const Test = require('./test.js');
const utils = require('../utils/utils.js');

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
  run: function(filePath) {
    const mocha = new Mocha();
    if (!filePath) {
      filePath = 'test/';
    }
    let configOptions = {
      gasPrice: 1
    };

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
        // ---------------- Deprecated code ------------------------------------------------------------
        global.assert = require('assert');

        global.config = function(config) {
          configOptions = utils.recursiveMerge(configOptions, config);
        };
        // TODO: check how to pass the options
        //global.EmbarkSpec = new Test(options);

        // TODO: this global here might not be necessary at all
        global.EmbarkSpec = new Test({});
        global.web3 = global.EmbarkSpec.web3;

        global.contract = function(describeName, callback) {
          return Mocha.describe(describeName, callback);
        };
        next();
        // ---------------- Deprecated code ------------------------------------------------------------
      }
    ], (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      // Run the tests.
      let runner = mocha.run(function(failures) {
        // Clean contracts folder for next test run
        fs.remove('.embark/contracts', (_err) => {
          process.on('exit', function () {
            process.exit(failures);  // exit with non-zero status if there were failures
          });
          process.exit();
        });
      });

      runner.on('suite', function() {
        global.assert = require('assert');
        global.EmbarkSpec = new Test({simulatorOptions: configOptions});
        global.web3 = global.EmbarkSpec.web3;
      });
    });
  }
};

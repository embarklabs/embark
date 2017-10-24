
module.exports = {
  run: function(filepath) {
    var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path');

    var mocha = new Mocha();

    if (filepath) {
      if (filepath.substr(-1) === '/') {
        // Add each .js file to the mocha instance
        fs.readdirSync(filepath).filter(function(file){
          // Only keep the .js files
          // TODO: make this a configuration in embark.json
          return file.substr(-3) === '.js';
        }).forEach(function(file){
          mocha.addFile(
            path.join(filepath, file)
          );
        });
      } else {
        mocha.addFile(filepath);
      }
    } else {
      var testDir = 'test/';

      // Add each .js file to the mocha instance
      fs.readdirSync(testDir).filter(function(file){
        // Only keep the .js files
        // TODO: make this a configuration in embark.json
        return file.substr(-3) === '.js';
      }).forEach(function(file){
        mocha.addFile(
          path.join(testDir, file)
        );
      });
    }

    let Test = require('./test.js');

    global.assert = require('assert');
    //global.Embark = require("../index.js");
    //global.EmbarkSpec = global.Embark.initTests();

    // TODO: check how to pass the options
    //global.EmbarkSpec = new Test(options);
    global.EmbarkSpec = new Test({});
    global.web3 = global.EmbarkSpec.web3;

    global.contract = function(describeName, callback) {
      return Mocha.describe(describeName, callback);
    };

    // Run the tests.
    let runner = mocha.run(function(failures){
      process.on('exit', function () {
        process.exit(failures);  // exit with non-zero status if there were failures
      });
      process.exit();
    });

    runner.on('suite', function() {
      global.assert = require('assert');
      //global.Embark = require("../index.js");
      //global.EmbarkSpec = global.Embark.initTests();
        // TODO: check how to pass the options
      //global.EmbarkSpec = new Test(options);
      global.EmbarkSpec = new Test({});
      global.web3 = global.EmbarkSpec.web3;
      //global.contract = Mocha.describe;
    });

  }
};


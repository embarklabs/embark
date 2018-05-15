const utils = require('../utils/utils.js');
const constants = require('../constants');
const ContractsManager = require('../contracts/contracts');
const File = require('../core/file.js');
const Config = require('../core/config.js');

// application container is shared by all unit tests
const container = require('../ioc/container');

module.exports = {
  run: function(filepath) {
    const Mocha = require('mocha'),
    fs = require('fs-extra'),
    path = require('path');

    const mocha = new Mocha();

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

    // TODO: check how to pass the options
    //global.EmbarkSpec = new Test(options);
    
    /****** SET ANY GLOBAL TEST VALUES HERE
     * these can be overridden in each test
     */
    container.bind('embarkConfigFile').toConstantValue('embark.json');//'./test/test1/embark.json');
    //container.bind('env').toConstantValue('development');
    container.bind('interceptLogs').toConstantValue(false);
    container.bind('context').toConstantValue([constants.contexts.tests]);
    
    // TODO: this global here might not be necessary at all
    global.assert = require('assert');
    global.EmbarkSpec = {};//new Test({});
    global.web3 = global.EmbarkSpec.web3;
    global.container = container;

    let configOptions = {
      gasPrice: 1
    };
    global.config = function(contractsConfig, contractFileNames, contractDirectories) {
      configOptions = utils.recursiveMerge(configOptions, contractsConfig);

        before("set up IOC container for testing", () => {
          // create a snapshot so each unit test can modify 
          // it without breaking other unit tests
          container.snapshot();

          let contractsMgr = container.resolve(ContractsManager);
          let config = container.get(Config);
          if(contractsConfig){
            contractsMgr.contractsConfig = configOptions;
            config.contractsConfig = configOptions;
          }
          if(contractFileNames !== undefined && contractFileNames.length){
            contractFileNames.forEach((fileName) => {
                contractsMgr.contractFiles.push(new File({filename: fileName, type: File.types.dapp_file, path: fileName}));
            });
          }
          if(contractDirectories !== undefined && contractDirectories.length){
            contractsMgr.contractDirectories = contractDirectories;
          }

          container.unbind(ContractsManager);
          container.bind(ContractsManager).toConstantValue(contractsMgr);

          container.unbind(Config);
          container.bind(Config).toConstantValue(config);
        });
        after("tear down testing IOC container", () => {
          // Restore to last snapshot so each unit test 
          // takes a clean copy of the application container
          container.restore();
        });
      
    };
    
    
    global.contract = function(describeName, callback) {
      return Mocha.describe(describeName, callback);
    };

    // Run the tests.
    mocha.enableTimeouts(false);
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
      global.container = container;
      global.timeout = 0;
      
    });

  }
};

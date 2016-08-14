var async = require('async');
var Web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var mkdirp = require('mkdirp');

var Deploy = require('./deploy.js');
var ContractsManager = require('./contracts.js');
var ABIGenerator = require('./abi.js');

var Embark = {
  initConfig: function(configDir, files, env) {
    this.contractsManager = new ContractsManager(configDir, files, env);
    this.contractsManager.init();
    return this.contractsManager;
  },

  deploy: function() {
    async.waterfall([
      function loadConfig(callback) {
      var contractsManager = Embark.initConfig('config/', 'app/contracts/**/*.sol', 'development');
      callback(null, contractsManager);
    },
    function buildContracts(contractsManager, callback) {
      contractsManager.build();
      callback(null, contractsManager);
    },
    function deployContracts(contractsManager, callback) {
      var web3 = new Web3();
      web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));
      var deploy = new Deploy(web3, contractsManager);
      deploy.deployAll(function() {
        callback(null, contractsManager);
      });
    },
    function generateABI(contractsManager, callback) {
      var abiGenerator = new ABIGenerator(contractsManager);
      console.log(abiGenerator.generateProvider());
      console.log(abiGenerator.generateContracts());
      callback(null, 'done');
    },
    ], function(err, result) {
      console.log(arguments);
    });
  },

  buildAssets: function() {
    var embarkConfig = JSON.parse(fs.readFileSync("embark.json"));

    var appConfig = embarkConfig.app;

    for(var targetFile in appConfig) {
      var originalFiles = grunt.file.expand(appConfig[targetFile]);
      console.log(originalFiles);
      // remove duplicates

      var content = originalFiles.filter(function(file) {
        return file.indexOf('.') >= 0;
      }).map(function(file) {
        console.log("reading " + file);
        return fs.readFileSync(file);
      }).join("\n");

      var dir = targetFile.split('/').slice(0, -1).join('/');
      console.log("creating dir " + "dist/" + dir);
      mkdirp.sync("dist/" + dir);

      //console.log(content);
      fs.writeFileSync("dist/" + targetFile, content);
    }
  }
};

//module.exports = Embark;


/*jshint esversion: 6 */
var async = require('async');
var Web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var mkdirp = require('mkdirp');
var colors = require('colors');
var chokidar = require('chokidar');

var Cmd = require('./cmd.js');
var Deploy = require('./deploy.js');
var ContractsManager = require('./contracts.js');
var ABIGenerator = require('./abi.js');
var TemplateGenerator = require('./template_generator.js');
var Blockchain = require('./blockchain.js');
var Server = require('./server.js');
var Watch = require('./watch.js');
var Pipeline = require('./pipeline.js');
var Test = require('./test.js');
var Logger = require('./logger.js');
var Config = require('./config.js');

var Embark = {

  process: function(args) {
    var cmd = new Cmd(Embark);
    cmd.process(args);
  },

  generateTemplate: function(templateName, destinationFolder, name) {
    var templateGenerator = new TemplateGenerator(templateName);
    templateGenerator.generate(destinationFolder, name);
  },

  initConfig: function(env, options) {
    this.config = new Config(env);
    this.config.loadConfigFiles(options);

    //this.contractsManager = new ContractsManager(configDir, files, env);
    //this.contractsManager.init();
    //return this.contractsManager;
  },

  run: function(env) {
    var self = this;
    async.waterfall([
      function deployAndGenerateABI(callback) {
        Embark.deploy(function(abi) {
          callback(null, abi);
        });
      },
      function buildPipeline(abi, callback) {
        var pipeline = new Pipeline({
          buildDir: self.config.buildDir,
          contractsFiles: self.config.contractsFiles,
          assetFiles: self.config.assetFiles
        });
        pipeline.build(abi);
        callback();
      },
      function startAssetServer(callback) {
        var server = new Server({});
        server.start(callback);
      },
      function watchFilesForChanges(callback) {
        var watch = new Watch();
        watch.start();
        callback();
      }
    ], function(err, result) {
      console.log("finished".underline);
    });
  },

  build: function(env) {
    async.waterfall([
      function deployAndGenerateABI(callback) {
        Embark.deploy(function(abi) {
          callback(null, abi);
        });
      },
      function buildPipeline(abi, callback) {
        var pipeline = new Pipeline({});
        pipeline.build(abi);
        callback();
      }
    ], function(err, result) {
      console.log("finished".underline);
    });
  },

  blockchain: function(env, client) {
    var blockchain = Blockchain(client);
    blockchain.run({env: env});
  },

  deploy: function(done) {
    var self = this;
    async.waterfall([
      function buildContracts(callback) {
        var contractsManager = new ContractsManager({
          contractFiles:  self.config.contractsFiles,
          contractsConfig: self.config.contractsConfig
        });
        contractsManager.init();
        contractsManager.build();
        callback(null, contractsManager);
      },
      function deployContracts(contractsManager, callback) {
        var web3 = new Web3();
        web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
        var deploy = new Deploy(web3, contractsManager);
        deploy.deployAll(function() {
          callback(null, contractsManager);
        });
      },
      function generateABI(contractsManager, callback) {
        var abiGenerator = new ABIGenerator(contractsManager);
        callback(null, abiGenerator.generateABI());
      },
    ], function(err, result) {
      done(result);
    });
  },

  initTests: function(options) {
    return new Test(options);
  }

};

module.exports = Embark;


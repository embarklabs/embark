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

var Embark = {

  process: function(args) {
    var cmd = new Cmd(Embark);
    cmd.process(args);
  },

  generateTemplate: function(templateName, destinationFolder, name) {
    var templateGenerator = new TemplateGenerator(templateName);
    templateGenerator.generate(destinationFolder, name);
  },

  initConfig: function(configDir, files, env) {
    this.contractsManager = new ContractsManager(configDir, files, env);
    this.contractsManager.init();
    return this.contractsManager;
  },

  run: function(env) {
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
  }

};

module.exports = Embark;


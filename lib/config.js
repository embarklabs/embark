var fs = require('fs');
var grunt = require('grunt');
var merge = require('merge');
var path = require('path');

// TODO: add wrapper for fs so it can also work in the browser
// can work with both read and save
var Config = function(options) {
  this.env = options.env;
  this.blockchainConfig = {};
  this.contractsConfig  = {};
  this.pipelineConfig   = {};
  this.chainTracker     = {};
  this.assetFiles = {};
  this.contractsFiles = [];
  this.configDir = options.configDir || 'config/';
  this.chainsFile = options.chainsFile || './chains.json';
};

Config.prototype.loadConfigFiles = function(options) {
  this.embarkConfig = JSON.parse(fs.readFileSync(options.embarkConfig));

  this.loadPipelineConfigFile();
  this.loadBlockchainConfigFile();
  this.loadContractsConfigFile();
  this.loadChainTrackerFile();
};

Config.prototype.reloadConfig = function() {
  this.loadPipelineConfigFile();
  this.loadBlockchainConfigFile();
  this.loadContractsConfigFile();
  this.loadChainTrackerFile();
};

Config.prototype.loadBlockchainConfigFile = function() {
  var defaultBlockchainConfig = JSON.parse(fs.readFileSync(this.configDir + "blockchain.json"))[this.env];
  this.blockchainConfig = defaultBlockchainConfig;
};

Config.prototype.loadContractsConfigFile = function() {
  var contractsConfig = JSON.parse(fs.readFileSync(this.configDir + "contracts.json"));
  var defaultContractsConfig = contractsConfig['default'];
  var envContractsConfig = contractsConfig[this.env];

  var mergedConfig = merge.recursive(defaultContractsConfig, envContractsConfig);
  this.contractsConfig = mergedConfig;
};

Config.prototype.loadPipelineConfigFile = function() {
  var contracts = this.embarkConfig.contracts;
  this.contractsFiles = this.loadFiles(contracts);

  var assets = this.embarkConfig.app;
  for(var targetFile in assets) {
    this.assetFiles[targetFile] = this.loadFiles(assets[targetFile]);
  }

  this.buildDir  = this.embarkConfig.buildDir;
  this.configDir = this.embarkConfig.config;
};

Config.prototype.loadChainTrackerFile = function() {
  //var self = this;
  var chainTracker;
  try {
    chainTracker = JSON.parse(fs.readFileSync(this.chainsFile));
  }
  catch(err) {
    //self.logger.info(this.chainsFile + ' file not found, creating it...');
    chainTracker = {};
    fs.writeFileSync(this.chainsFile, '{}');
  }
  this.chainTracker = chainTracker;
};

Config.prototype.loadFiles = function(files) {
  var originalFiles = grunt.file.expand({nonull: true}, files);
  var readFiles = [];

  originalFiles.filter(function(file) {
    return file.indexOf('.') >= 0;
  }).filter(function(file) {
    if (file === 'embark.js') {
      readFiles.push({filename: 'web3.js',   content: fs.readFileSync(path.join(__dirname, "/../js/web3.js")).toString()});
      readFiles.push({filename: 'ipfs.js',   content: fs.readFileSync(path.join(__dirname, "/../js/ipfs.js")).toString()});
      readFiles.push({filename: 'embark.js', content: fs.readFileSync(path.join(__dirname, "/../js/build/embark.bundle.js")).toString()});
    } else {
      readFiles.push({filename: file, content: fs.readFileSync(file).toString()});
    }
  });

  return readFiles;
};

module.exports = Config;

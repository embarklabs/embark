var fs = require('fs');
var grunt = require('grunt');

var Config = function(env) {
  this.env = env;
  this.blockchainConfig = {};
  this.contractsConfig  = {};
  this.pipelineConfig   = {};
  this.assetFiles = {};
  this.contractsFiles = [];
  this.configDir = 'config/';
};

Config.prototype.loadConfigFiles = function(options) {
  this.embarkConfig = JSON.parse(fs.readFileSync(options.embarkConfig));

  this.loadPipelineConfigFile();
  this.loadBlockchainConfigFile();
  this.loadContractsConfigFile();
};

Config.prototype.loadBlockchainConfigFile = function() {
  var defaultBlockchainConfig = JSON.parse(fs.readFileSync(this.configDir + this.env + "/blockchain.json"))[this.env];
  this.blockchainConfig = defaultBlockchainConfig;
};

Config.prototype.loadContractsConfigFile = function() {
  var defaultContractsConfig = JSON.parse(fs.readFileSync(this.configDir + "contracts.json"))['default'];
  //var envContractsConfig = JSON.parse(fs.readFileSync(this.configDir + this.env + "/contracts.json"))[this.env];

  //merge.recursive(defaultContractsConfig, envContractsConfig);
  this.contractsConfig = defaultContractsConfig;
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

Config.prototype.loadFiles = function(files) {
  var originalFiles = grunt.file.expand({nonull: true}, files);
  var readFiles = [];

  originalFiles.filter(function(file) {
    return file.indexOf('.') >= 0;
  }).filter(function(file) {
    if (file === 'embark.js') {
      readFiles.push({filename: 'bluebird.js', content: fs.readFileSync("../js/bluebird.js").toString()});
      readFiles.push({filename: 'web3.js',     content: fs.readFileSync("../js/web3.js").toString()});
      readFiles.push({filename: 'embark.js',   content: fs.readFileSync("../js/embark.js").toString()});
    } else {
      readFiles.push({filename: file, content: fs.readFileSync(file).toString()});
    }
  });

  return readFiles;
};

module.exports = Config;

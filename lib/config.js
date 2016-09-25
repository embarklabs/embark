var fs = require('fs');
var grunt = require('grunt');

// TODO: add wrapper for fs so it can also work in the browser
// can work with both read and save
var Config = function(env) {
  this.env = env;
  this.blockchainConfig = {};
  this.contractsConfig  = {};
  this.pipelineConfig   = {};
  this.chainTracker     = {};
  this.assetFiles = {};
  this.contractsFiles = [];
  this.configDir = 'config/';
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

Config.prototype.loadChainTrackerFile = function() {
  //var self = this;
  var chainTracker;
  try {
    chainTracker = JSON.parse(fs.readFileSync("./chains.json"));
  }
  catch(err) {
    //self.logger.info('chains.json file not found, creating it...');
    chainTracker = {};
    fs.writeFileSync('./chains.json', '{}');
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
      //readFiles.push({filename: 'bluebird.js', content: fs.readFileSync("../js/bluebird.js").toString()});
      readFiles.push({filename: 'web3.js',     content: fs.readFileSync("../js/web3.js").toString()});
      //readFiles.push({filename: 'embark.js',   content: fs.readFileSync("../js/ipfs.js").toString()+ fs.readFileSync("../js/build/embark.bundle.js").toString()});
      readFiles.push({filename: 'ipfs.js',   content: fs.readFileSync("../js/ipfs.js").toString()});
      readFiles.push({filename: 'embark.js', content: fs.readFileSync("../js/build/embark.bundle.js").toString()});
    } else {
      readFiles.push({filename: file, content: fs.readFileSync(file).toString()});
    }
  });

  return readFiles;
};

module.exports = Config;

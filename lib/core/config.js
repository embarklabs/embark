var fs = require('./fs.js');
var File = require('./file.js');
var Plugins = require('./plugins.js');
var utils = require('../utils/utils.js');
var path = require('path');

var Config = function(options) {
  this.env = options.env;
  this.blockchainConfig = {};
  this.contractsConfig  = {};
  this.pipelineConfig   = {};
  this.webServerConfig  = {};
  this.chainTracker     = {};
  this.assetFiles = {};
  this.contractsFiles = [];
  this.configDir = options.configDir || 'config/';
  this.chainsFile = options.chainsFile || './chains.json';
  this.plugins = options.plugins;
  this.logger = options.logger;
  this.events = options.events;
};

Config.prototype.loadConfigFiles = function(options) {
  var interceptLogs = options.interceptLogs;
  if (options.interceptLogs === undefined) {
    interceptLogs = true;
  }

  if (!fs.existsSync(options.embarkConfig)){
    this.logger.error('Cannot find file ' + options.embarkConfig + '. Please ensure you are running this command inside the Dapp folder');
    process.exit(1);
  }

  this.embarkConfig = fs.readJSONSync(options.embarkConfig);
  this.embarkConfig.plugins = this.embarkConfig.plugins || {};

  this.plugins = new Plugins({plugins: this.embarkConfig.plugins, logger: this.logger, interceptLogs: interceptLogs, events: this.events, config: this});
  this.plugins.loadPlugins();

  this.loadEmbarkConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadCommunicationConfigFile();

  this.loadContractsConfigFile();
  this.loadPipelineConfigFile();

  this.loadContractsConfigFile();
  this.loadWebServerConfigFile();
  this.loadChainTrackerFile();
  this.loadPluginContractFiles();
};

Config.prototype.reloadConfig = function() {
  this.loadEmbarkConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadCommunicationConfigFile();
  this.loadContractsConfigFile();
  this.loadPipelineConfigFile();
  this.loadContractsConfigFile();
  this.loadChainTrackerFile();
};

Config.prototype._mergeConfig = function(configFilename, defaultConfig, env) {
  let configFilePath = this.configDir + configFilename;
  if (!fs.existsSync(configFilePath)) {
    this.logger.warn("no config file found at " + configFilePath + ". using default config");
    return defaultConfig['default'] || {};
  }

  let config = fs.readJSONSync(configFilePath);
  let configObject = utils.recursiveMerge(defaultConfig, config);

  if (env) {
    return utils.recursiveMerge(configObject['default'] || {}, configObject[env]);
  } else {
    return configObject;
  }
};

Config.prototype.loadBlockchainConfigFile = function() {
  var configObject = {
    "default": {
      "enabled": true
    }
  };

  this.blockchainConfig = this._mergeConfig("blockchain.json", configObject, this.env);
};

Config.prototype.loadContractsConfigFile = function() {
  var configObject = {
    "default": {
      "versions": {
        "web3.js": "1.0.0-beta",
        "solc": "0.4.17"
      },
      "deployment": {
        "host": "localhost", "port": 8545, "type": "rpc"
      },
      "dappConnection": [
        "$WEB3",
        "localhost:8545"
      ],
      "gas": "auto",
      "contracts": {
      }
    }
  };

  var contractsConfigs = this.plugins.getPluginsProperty('contractsConfig', 'contractsConfigs');
  contractsConfigs.forEach(function(pluginConfig) {
    configObject = utils.recursiveMerge(configObject, pluginConfig);
  });

  this.contractsConfig = this._mergeConfig("contracts.json", configObject, this.env);
};

Config.prototype.loadStorageConfigFile = function() {
  var configObject = {
    "default": {
      "versions": {
        "ipfs-api": "17.2.4"
      },
      "enabled": true,
      "available_providers": ["ipfs"],
      "ipfs_bin": "ipfs",
      "provider": "ipfs",
      "host": "localhost",
      "port": 5001,
      "getUrl": "http://localhost:8080/ipfs/"
    }
  };

  this.storageConfig = this._mergeConfig("storage.json", configObject, this.env);
};

Config.prototype.loadCommunicationConfigFile = function() {
  var configObject = {
    "default": {
      "enabled": true,
      "provider": "whisper",
      "available_providers": ["whisper", "orbit"],
      "connection": {
        "host": "localhost", "port": 8546, "type": "ws"
      }
    }
  };

  this.communicationConfig = this._mergeConfig("communication.json", configObject, this.env);
};

Config.prototype.loadWebServerConfigFile = function() {
  var configObject = {
    "enabled": true, "host": "localhost", "port": 8000
  };

  this.webServerConfig = this._mergeConfig("webserver.json", configObject, false);
};

Config.prototype.loadEmbarkConfigFile = function() {
  var contracts = this.embarkConfig.contracts;
  this.contractsFiles = this.loadFiles(contracts);
  // determine contract 'root' directories
  this.contractDirectories = contracts.map((dir) => {
    return dir.split("**")[0];
  }).map((dir) => {
    return dir.split("*.")[0];
  });

  this.buildDir  = this.embarkConfig.buildDir;
  this.configDir = this.embarkConfig.config;
};

Config.prototype.loadPipelineConfigFile = function() {
  var assets = this.embarkConfig.app;
  for(var targetFile in assets) {
    this.assetFiles[targetFile] = this.loadFiles(assets[targetFile]);
  }
};

Config.prototype.loadChainTrackerFile = function() {
  if (!fs.existsSync(this.chainsFile)) {
    this.logger.info(this.chainsFile + ' file not found, creating it...');
    fs.writeJSONSync(this.chainsFile, {});
  }

  this.chainTracker = fs.readJSONSync(this.chainsFile);
};

function findMatchingExpression(filename, filesExpressions) {
  for (let fileExpression of filesExpressions) {
    var matchingFiles = utils.filesMatchingPattern(fileExpression);
    for (let matchFile of matchingFiles) {
      if (matchFile === filename) {
        return path.dirname(fileExpression).replace(/\*/g, '');
      }
    }
  }
  return path.dirname(filename);
}

Config.prototype.loadFiles = function(files) {
  var self = this;
  var originalFiles = utils.filesMatchingPattern(files);
  var readFiles = [];

  originalFiles.filter(function(file) {
    return (file[0] === '$' || file.indexOf('.') >= 0);
  }).filter(function(file) {
    let basedir = findMatchingExpression(file, files);
    readFiles.push(new File({filename: file, type: "dapp_file", basedir: basedir, path: file}));
  });

  var filesFromPlugins = [];
  var filePlugins = self.plugins.getPluginsFor('pipelineFiles');
  filePlugins.forEach(function(plugin) {
    try {
      var fileObjects = plugin.runFilePipeline();
      for (var i=0; i < fileObjects.length; i++) {
        var fileObject = fileObjects[i];
        filesFromPlugins.push(fileObject);
      }
    }
    catch(err) {
      self.logger.error(err.message);
    }
  });
  filesFromPlugins.filter(function(file) {
    if (utils.fileMatchesPattern(files, file.intendedPath)) {
      readFiles.push(file);
    }
  });

  return readFiles;
};

Config.prototype.loadPluginContractFiles = function() {
  var self = this;

  var contractsPlugins = this.plugins.getPluginsFor('contractFiles');
  contractsPlugins.forEach(function(plugin) {
    plugin.contractsFiles.forEach(function(file) {
      var filename = file.replace('./','');
      self.contractsFiles.push(new File({filename: filename, type: 'custom', resolver: function(callback) {
        callback(plugin.loadPluginFile(file));
      }}));
    });
  });
};

module.exports = Config;

var fs = require('./fs.js');
var File = require('./file.js');
var Plugins = require('./plugins.js');
var utils = require('../utils/utils.js');

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

  //Check if the config file exists
  var embarkConfigExists = fs.existsSync(options.embarkConfig);
  if(!embarkConfigExists){
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

Config.prototype.loadBlockchainConfigFile = function() {
  var defaultBlockchainConfig = fs.readJSONSync(this.configDir + "blockchain.json");
  this.blockchainConfig = defaultBlockchainConfig[this.env] || {};

  if (this.blockchainConfig.enabled === undefined) {
    this.blockchainConfig.enabled = true;
  }
};

Config.prototype.loadContractsConfigFile = function() {

  var configObject = {
    "versions": {
      "web3.js": "0.19.1",
      "solc": "0.4.17"
    },
    "deployment": {
      "host": "localhost",
      "port": 8545,
      "type": "rpc"
    },
    "dappConnection": [
      "$WEB3",
      "localhost:8545"
    ]
  };

  var configPlugins = this.plugins.getPluginsFor('contractsConfig');
  if (configPlugins.length > 0) {
    configPlugins.forEach(function(plugin) {
      plugin.contractsConfigs.forEach(function(pluginConfig) {
        configObject = utils.recursiveMerge(configObject, pluginConfig);
      });
    });
  }

  var contractsConfig = fs.readJSONSync(this.configDir + "contracts.json");
  configObject = utils.recursiveMerge(configObject, contractsConfig);
  var defaultContractsConfig = configObject['default'];
  var envContractsConfig = configObject[this.env];

  var mergedConfig = utils.recursiveMerge(defaultContractsConfig, envContractsConfig);
  this.contractsConfig = mergedConfig;
};


Config.prototype.loadStorageConfigFile = function() {
  var configObject = {
    "default": {
      "enabled": true,
      "available_providers": ["ipfs"],
      "ipfs_bin": "ipfs",
      "provider": "ipfs",
      "host": "localhost",
      "port": 5001,
      "getUrl": "http://localhost:8080/ipfs/"
    },
    "development": {
    }
  };

  var storageConfig;
  if (fs.existsSync(this.configDir + "storage.json")) {
    storageConfig = fs.readJSONSync(this.configDir + "storage.json");
    configObject = utils.recursiveMerge(configObject, storageConfig);
  }

  var defaultStorageConfig = configObject['default'];
  var envStorageConfig = configObject[this.env];

  var mergedConfig = utils.recursiveMerge(defaultStorageConfig, envStorageConfig);
  this.storageConfig = mergedConfig || {};

  if (this.storageConfig.enabled === undefined) {
    this.storageConfig.enabled = true;
  }
  if (this.storageConfig.available_providers === undefined) {
    this.storageConfig.available_providers = [];
  }
};

Config.prototype.loadCommunicationConfigFile = function() {
  var configObject = {
    "default": {
      "enabled": true,
      "provider": "whisper",
      "available_providers": ["whisper", "orbit"],
      "connection": {
        "host": "localhost",
        "port": 8546,
        "type": "ws"
      }
    }
  };

  var communicationConfig;

  if (fs.existsSync(this.configDir + "communication.json")) {
    communicationConfig = fs.readJSONSync(this.configDir + "communication.json");
    configObject = utils.recursiveMerge(configObject, communicationConfig);
  }

  var defaultCommunicationConfig = configObject['default'];
  var envCommunicationConfig = configObject[this.env];

  var mergedConfig = utils.recursiveMerge(defaultCommunicationConfig, envCommunicationConfig);
  this.communicationConfig = mergedConfig || {};

  // TODO: probably not necessary if the default object is done right
  if (this.communicationConfig.enabled === undefined) {
    this.communicationConfig.enabled = true;
  }
  if (this.communicationConfig.available_providers === undefined) {
    this.communicationConfig.available_providers = [];
  }
};

Config.prototype.loadWebServerConfigFile = function() {
  var webServerConfigJSON;
  if (fs.existsSync(this.configDir + "webserver.json")) {
    webServerConfigJSON = fs.readJSONSync(this.configDir + "webserver.json");
  } else {
    webServerConfigJSON = {};
  }
  var defaultWebConfig = {
    "enabled": true,
    "host": "localhost",
    "port": 8000
  };
  this.webServerConfig = utils.recursiveMerge(defaultWebConfig, webServerConfigJSON);
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
  //var self = this;
  var chainTracker;
  try {
    chainTracker = fs.readJSONSync(this.chainsFile);
  }
  catch(err) {
    //self.logger.info(this.chainsFile + ' file not found, creating it...');
    chainTracker = {};
    fs.writeJSONSync(this.chainsFile, {});
  }
  this.chainTracker = chainTracker;
};

Config.prototype.loadFiles = function(files) {
  var self = this;
  var originalFiles = utils.filesMatchingPattern(files);
  var readFiles = [];

  originalFiles.filter(function(file) {
    return (file[0] === '$' || file.indexOf('.') >= 0);
  }).filter(function(file) {
    readFiles.push(new File({filename: file, type: "dapp_file", path: file}));
  });

  var filesFromPlugins = [];
  var filePlugins = self.plugins.getPluginsFor('pipelineFiles');
  if (filePlugins.length > 0) {
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
  }
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
  if (contractsPlugins.length > 0) {
    contractsPlugins.forEach(function(plugin) {
      plugin.contractsFiles.forEach(function(file) {
        var filename = file.replace('./','');
        //self.contractsFiles.push({filename: filename, content: plugin.loadPluginFile(file), path: plugin.pathToFile(file)});
        self.contractsFiles.push(new File({filename: filename, type: 'custom', resolver: function(callback) {
          callback(plugin.loadPluginFile(file));
        }}));
      });
    });
  }
};

module.exports = Config;

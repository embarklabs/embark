var fs = require('./fs.js');
var Plugins = require('./plugins.js');
var utils = require('./utils.js');

// TODO: add wrapper for fs so it can also work in the browser
// can work with both read and save
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

  var configObject = {};

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
      "port": 5001
    },
    "development": {
    }
  };

  //var configPlugins = this.plugins.getPluginsFor('storageConfig');
  //if (configPlugins.length > 0) {
  //  configPlugins.forEach(function(plugin) {
  //    plugin.contractsConfigs.forEach(function(pluginConfig) {
  //      configObject = utils.recursiveMerge(configObject, pluginConfig);
  //    });
  //  });
  //}

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
      "available_providers": ["whisper", "orbit"]
    }
  };

  //var configPlugins = this.plugins.getPluginsFor('communicationConfig');
  //if (configPlugins.length > 0) {
  //  configPlugins.forEach(function(plugin) {
  //    plugin.contractsConfigs.forEach(function(pluginConfig) {
  //      configObject = utils.recursiveMerge(configObject, pluginConfig);
  //    });
  //  });
  //}

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

  // get embark.js object first
  originalFiles.filter(function(file) {
    return file.indexOf('.') >= 0;
  }).filter(function(file) {
    if (file === 'embark.js') {

      if (self.blockchainConfig.enabled || self.communicationConfig.provider === 'whisper' || self.communicationConfig.available_providers.indexOf('whisper') >= 0) {
        readFiles.push({filename: 'web3.js',   content: fs.readFileSync(fs.embarkPath("js/web3.js")).toString(), path: fs.embarkPath("js/web3.js")});
      }

      if (self.storageConfig.enabled && (self.storageConfig.provider === 'ipfs' || self.storageConfig.available_providers.indexOf('ipfs') >= 0)) {
        readFiles.push({filename: 'ipfs.js',   content: fs.readFileSync(fs.embarkPath("js/ipfs.js")).toString(), path: fs.embarkPath("js/ipfs.js")});
      }

      if (self.communicationConfig.enabled && (self.communicationConfig.provider === 'orbit' || self.communicationConfig.available_providers.indexOf('orbit') >= 0)) {
        // TODO: remove duplicated files if functionality is the same for storage and orbit
        readFiles.push({filename: 'ipfs-api.js',   content: fs.readFileSync(fs.embarkPath("js/ipfs-api.min.js")).toString(), path: fs.embarkPath("js/ipfs-api.min.js")});
        readFiles.push({filename: 'orbit.js',  content: fs.readFileSync(fs.embarkPath("js/orbit.min.js")).toString(), path: fs.embarkPath("js/orbit.min.js")});
      }

      readFiles.push({filename: 'embark.js', content: fs.readFileSync(fs.embarkPath("js/build/embark.bundle.js")).toString(), path: fs.embarkPath("js/build/embark.bundle.js")});
    }
  });

  // get plugins
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

  // get user files
  originalFiles.filter(function(file) {
    return file.indexOf('.') >= 0;
  }).filter(function(file) {
    if (file === 'embark.js') {
      return;
    } else if (file === 'abi.js') {
      readFiles.push({filename: file, content: "", path: file});
    } else {
      readFiles.push({filename: file, content: fs.readFileSync(file).toString(), path: file});
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
        self.contractsFiles.push({filename: filename, content: plugin.loadPluginFile(file), path: plugin.pathToFile(file)});
      });
    });
  }
};

module.exports = Config;

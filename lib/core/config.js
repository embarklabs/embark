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
  this.chainTracker     = {};
  this.assetFiles = {};
  this.contractsFiles = [];
  this.configDir = options.configDir || 'config/';
  this.chainsFile = options.chainsFile || './chains.json';
  this.plugins = options.plugins;
  this.logger = options.logger;
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

  this.plugins = new Plugins({plugins: this.embarkConfig.plugins, logger: this.logger, interceptLogs: interceptLogs});
  this.plugins.loadPlugins();

  this.loadPipelineConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadCommunicationConfigFile();

  this.loadContractsConfigFile();
  this.loadChainTrackerFile();
  this.loadPluginContractFiles();
};

Config.prototype.reloadConfig = function() {
  this.loadPipelineConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadCommunicationConfigFile();
  this.loadContractsConfigFile();
  this.loadChainTrackerFile();
};

Config.prototype.loadBlockchainConfigFile = function() {
  var defaultBlockchainConfig = fs.readJSONSync(this.configDir + "blockchain.json");
  this.blockchainConfig = defaultBlockchainConfig[this.env];
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
  var configObject = {};

  //var configPlugins = this.plugins.getPluginsFor('storageConfig');
  //if (configPlugins.length > 0) {
  //  configPlugins.forEach(function(plugin) {
  //    plugin.contractsConfigs.forEach(function(pluginConfig) {
  //      configObject = utils.recursiveMerge(configObject, pluginConfig);
  //    });
  //  });
  //}

  var storageConfig = fs.readJSONSync(this.configDir + "storage.json");
  configObject = utils.recursiveMerge(configObject, storageConfig);
  var defaultStorageConfig = configObject['default'];
  var envStorageConfig = configObject[this.env];

  var mergedConfig = utils.recursiveMerge(defaultStorageConfig, envStorageConfig);
  this.storageConfig = mergedConfig;
};

Config.prototype.loadCommunicationConfigFile = function() {
  var configObject = {};

  //var configPlugins = this.plugins.getPluginsFor('communicationConfig');
  //if (configPlugins.length > 0) {
  //  configPlugins.forEach(function(plugin) {
  //    plugin.contractsConfigs.forEach(function(pluginConfig) {
  //      configObject = utils.recursiveMerge(configObject, pluginConfig);
  //    });
  //  });
  //}

  var communicationConfig = fs.readJSONSync(this.configDir + "communication.json");
  configObject = utils.recursiveMerge(configObject, communicationConfig);
  var defaultCommunicationConfig = configObject['default'];
  var envCommunicationConfig = configObject[this.env];

  var mergedConfig = utils.recursiveMerge(defaultCommunicationConfig, envCommunicationConfig);
  this.communicationConfig = mergedConfig;
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
      readFiles.push({filename: 'web3.js',   content: fs.readFileSync(fs.embarkPath("js/web3.js")).toString(), path: fs.embarkPath("js/web3.js")});
      readFiles.push({filename: 'ipfs.js',   content: fs.readFileSync(fs.embarkPath("js/ipfs.js")).toString(), path: fs.embarkPath("js/ipfs.js")});
      // TODO: remove duplicated files if funcitonality is the same for storage and orbit
      readFiles.push({filename: 'ipfs-api.js',   content: fs.readFileSync(fs.embarkPath("js/ipfs-api.min.js")).toString(), path: fs.embarkPath("js/ipfs-api.min.js")});
      readFiles.push({filename: 'orbit.js',  content: fs.readFileSync(fs.embarkPath("js/orbit.min.js")).toString(), path: fs.embarkPath("js/orbit.min.js")});
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

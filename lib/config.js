var fs = require('fs');
var grunt = require('grunt');
var merge = require('merge');
var path = require('path');
var Plugins = require('./plugins.js');

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
  this.embarkConfig = JSON.parse(fs.readFileSync(options.embarkConfig));
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
  var defaultBlockchainConfig = JSON.parse(fs.readFileSync(this.configDir + "blockchain.json"))[this.env];
  this.blockchainConfig = defaultBlockchainConfig;
};

Config.prototype.loadContractsConfigFile = function() {

  var configObject = {};

  var configPlugins = this.plugins.getPluginsFor('contractsConfig');
  if (configPlugins.length > 0) {
    configPlugins.forEach(function(plugin) {
      plugin.contractsConfigs.forEach(function(pluginConfig) {
        configObject = merge.recursive(configObject, pluginConfig);
      });
    });
  }

  var contractsConfig = JSON.parse(fs.readFileSync(this.configDir + "contracts.json"));
  configObject = merge.recursive(configObject, contractsConfig);
  var defaultContractsConfig = configObject['default'];
  var envContractsConfig = configObject[this.env];

  var mergedConfig = merge.recursive(defaultContractsConfig, envContractsConfig);
  this.contractsConfig = mergedConfig;
};


Config.prototype.loadStorageConfigFile = function() {
  var configObject = {};

  //var configPlugins = this.plugins.getPluginsFor('storageConfig');
  //if (configPlugins.length > 0) {
  //  configPlugins.forEach(function(plugin) {
  //    plugin.contractsConfigs.forEach(function(pluginConfig) {
  //      configObject = merge.recursive(configObject, pluginConfig);
  //    });
  //  });
  //}

  var storageConfig = JSON.parse(fs.readFileSync(this.configDir + "storage.json"));
  configObject = merge.recursive(configObject, storageConfig);
  var defaultStorageConfig = configObject['default'];
  var envStorageConfig = configObject[this.env];

  var mergedConfig = merge.recursive(defaultStorageConfig, envStorageConfig);
  this.storageConfig = mergedConfig;
};

Config.prototype.loadCommunicationConfigFile = function() {
  var configObject = {};

  //var configPlugins = this.plugins.getPluginsFor('communicationConfig');
  //if (configPlugins.length > 0) {
  //  configPlugins.forEach(function(plugin) {
  //    plugin.contractsConfigs.forEach(function(pluginConfig) {
  //      configObject = merge.recursive(configObject, pluginConfig);
  //    });
  //  });
  //}

  var communicationConfig = JSON.parse(fs.readFileSync(this.configDir + "communication.json"));
  configObject = merge.recursive(configObject, communicationConfig);
  var defaultCommunicationConfig = configObject['default'];
  var envCommunicationConfig = configObject[this.env];

  var mergedConfig = merge.recursive(defaultCommunicationConfig, envCommunicationConfig);
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
  var self = this;
  var originalFiles = grunt.file.expand({nonull: true}, files);
  var readFiles = [];

  // get embark.js object first
  originalFiles.filter(function(file) {
    return file.indexOf('.') >= 0;
  }).filter(function(file) {
    if (file === 'embark.js') {
      readFiles.push({filename: 'web3.js',   content: fs.readFileSync(path.join(__dirname, "/../js/web3.js")).toString(), path: path.join(__dirname, "/../js/web3.js")});
      readFiles.push({filename: 'ipfs.js',   content: fs.readFileSync(path.join(__dirname, "/../js/ipfs.js")).toString(), path: path.join(__dirname, "/../js/ipfs.js")});
      // TODO: remove duplicated files if funcitonality is the same for storage and orbit
      readFiles.push({filename: 'ipfs-api.js',   content: fs.readFileSync(path.join(__dirname, "/../js/ipfs-api.min.js")).toString(), path: path.join(__dirname, "/../js/ipfs-api.min.js")});
      readFiles.push({filename: 'orbit.js',      content: fs.readFileSync(path.join(__dirname, "/../js/orbit.min.js")).toString(), path: path.join(__dirname, "/../js/orbit.min.js")});
      readFiles.push({filename: 'embark.js', content: fs.readFileSync(path.join(__dirname, "/../js/build/embark.bundle.js")).toString(), path: path.join(__dirname, "/../js/build/embark.bundle.js")});
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
    if (grunt.file.isMatch(files, file.intendedPath)) {
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

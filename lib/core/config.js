let fs = require('./fs.js');
let Plugins = require('./plugins.js');
let utils = require('../utils/utils.js');

// TODO: add wrapper for fs so it can also work in the browser
// can work with both read and save
class Config {
  constructor(options) {
    this.env = options.env;
    this.blockchainConfig = {};
    this.contractsConfig = {};
    this.pipelineConfig = {};
    this.webServerConfig = {};
    this.chainTracker = {};
    this.assetFiles = {};
    this.contractsFiles = [];
    this.configDir = options.configDir || 'config/';
    this.chainsFile = options.chainsFile || './chains.json';
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
  }
}

Config.prototype.loadConfigFiles = function (options) {
  let interceptLogs = options.interceptLogs;
  if (options.interceptLogs === undefined) {
    interceptLogs = true;
  }

  //Check if the config file exists
  let embarkConfigExists = fs.existsSync(options.embarkConfig);
  if (!embarkConfigExists) {
    this.logger.error('Cannot find file ' + options.embarkConfig + '. Please ensure you are running this command inside the Dapp folder');
    process.exit(1);
  }

  this.embarkConfig = fs.readJSONSync(options.embarkConfig);
  this.embarkConfig.plugins = this.embarkConfig.plugins || {};

  this.plugins = new Plugins({
    plugins: this.embarkConfig.plugins,
    logger: this.logger,
    interceptLogs: interceptLogs,
    events: this.events,
    config: this
  });
  this.plugins.loadPlugins();

  this.load();
  this.loadWebServerConfigFile();
  this.loadChainTrackerFile();
  this.loadPluginContractFiles();
};

Config.prototype.load = Config.prototype.reloadConfig = function () {
  this.loadEmbarkConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadCommunicationConfigFile();
  this.loadPipelineConfigFile();
  this.loadContractsConfigFile();
  this.loadChainTrackerFile();
};

Config.prototype.loadBlockchainConfigFile = function () {
  let defaultBlockchainConfig = fs.readJSONSync(this.configDir + "blockchain.json");
  this.blockchainConfig = defaultBlockchainConfig[this.env] || {};

  if (this.blockchainConfig.enabled === undefined) {
    this.blockchainConfig.enabled = true;
  }
};

Config.prototype.loadContractsConfigFile = function () {

  let configObject = {};
  let configPlugins = [];
  this.plugins.emit('get', 'contractsConfig', (kinds) => {
    configPlugins = kinds;
  });
  if (configPlugins.length > 0) {
    configPlugins.forEach(function (plugin) {
      plugin.contractsConfigs.forEach(function (pluginConfig) {
        configObject = utils.recursiveMerge(configObject, pluginConfig);
      });
    });
  }

  let contractsConfig = fs.readJSONSync(this.configDir + "contracts.json");
  configObject = utils.recursiveMerge(configObject, contractsConfig);
  let defaultContractsConfig = configObject['default'];
  let envContractsConfig = configObject[this.env];

  this.contractsConfig = utils.recursiveMerge(defaultContractsConfig, envContractsConfig);
};


Config.prototype.loadStorageConfigFile = function () {
  let configObject = {
    "default": {
      "enabled": true,
      "available_providers": ["ipfs"],
      "ipfs_bin": "ipfs",
      "provider": "ipfs",
      "host": "localhost",
      "port": 5001
    },
    "development": {}
  };

  //let configPlugins = this.plugins.getPluginsFor('storageConfig');
  //if (configPlugins.length > 0) {
  //  configPlugins.forEach(function(plugin) {
  //    plugin.contractsConfigs.forEach(function(pluginConfig) {
  //      configObject = utils.recursiveMerge(configObject, pluginConfig);
  //    });
  //  });
  //}

  let storageConfig;
  if (fs.existsSync(this.configDir + "storage.json")) {
    storageConfig = fs.readJSONSync(this.configDir + "storage.json");
    configObject = utils.recursiveMerge(configObject, storageConfig);
  }

  let defaultStorageConfig = configObject['default'];
  let envStorageConfig = configObject[this.env];

  let mergedConfig = utils.recursiveMerge(defaultStorageConfig, envStorageConfig);
  this.storageConfig = mergedConfig || {};

  if (this.storageConfig.enabled === undefined) {
    this.storageConfig.enabled = true;
  }
  if (this.storageConfig.available_providers === undefined) {
    this.storageConfig.available_providers = [];
  }
};

Config.prototype.loadCommunicationConfigFile = function () {
  let configObject = {
    "default": {
      "enabled": true,
      "provider": "whisper",
      "available_providers": ["whisper", "orbit"]
    }
  };

  //let configPlugins = this.plugins.getPluginsFor('communicationConfig');
  //if (configPlugins.length > 0) {
  //  configPlugins.forEach(function(plugin) {
  //    plugin.contractsConfigs.forEach(function(pluginConfig) {
  //      configObject = utils.recursiveMerge(configObject, pluginConfig);
  //    });
  //  });
  //}

  let communicationConfig;

  if (fs.existsSync(this.configDir + "communication.json")) {
    communicationConfig = fs.readJSONSync(this.configDir + "communication.json");
    configObject = utils.recursiveMerge(configObject, communicationConfig);
  }

  let defaultCommunicationConfig = configObject['default'];
  let envCommunicationConfig = configObject[this.env];

  let mergedConfig = utils.recursiveMerge(defaultCommunicationConfig, envCommunicationConfig);
  this.communicationConfig = mergedConfig || {};

  // TODO: probably not necessary if the default object is done right
  if (this.communicationConfig.enabled === undefined) {
    this.communicationConfig.enabled = true;
  }
  if (this.communicationConfig.available_providers === undefined) {
    this.communicationConfig.available_providers = [];
  }
};

Config.prototype.loadWebServerConfigFile = function () {
  let webServerConfigJSON;
  if (fs.existsSync(this.configDir + "webserver.json")) {
    webServerConfigJSON = fs.readJSONSync(this.configDir + "webserver.json");
  } else {
    webServerConfigJSON = {};
  }
  let defaultWebConfig = {
    "enabled": true,
    "host": "localhost",
    "port": 8000
  };
  this.webServerConfig = utils.recursiveMerge(defaultWebConfig, webServerConfigJSON);
};

Config.prototype.loadEmbarkConfigFile = function () {
  let contracts = this.embarkConfig.contracts;
  this.contractsFiles = this.loadFiles(contracts);

  this.buildDir = this.embarkConfig.buildDir;
  this.configDir = this.embarkConfig.config;
};

Config.prototype.loadPipelineConfigFile = function () {
  let assets = this.embarkConfig.app;
  for (let targetFile in assets) {
    this.assetFiles[targetFile] = this.loadFiles(assets[targetFile]);
  }
};

Config.prototype.loadChainTrackerFile = function () {
  //let self = this;
  let chainTracker;
  try {
    chainTracker = fs.readJSONSync(this.chainsFile);
  }
  catch (err) {
    //self.logger.info(this.chainsFile + ' file not found, creating it...');
    chainTracker = {};
    fs.writeJSONSync(this.chainsFile, {});
  }
  this.chainTracker = chainTracker;
};

Config.prototype.loadFiles = function (files) {
  let self = this;
  let originalFiles = utils.filesMatchingPattern(files);
  let readFiles = [];

  // get embark.js object first
  originalFiles.filter(function (file) {
    return file.indexOf('.') >= 0;
  }).filter(function (file) {
    if (file === 'embark.js') {

      if (self.blockchainConfig.enabled || self.communicationConfig.provider === 'whisper' || self.communicationConfig.available_providers.indexOf('whisper') >= 0) {
        readFiles.push({
          filename: 'web3.js',
          content: fs.readFileSync(fs.embarkPath("js/web3.js")).toString(),
          path: fs.embarkPath("js/web3.js")
        });
      }

      if (self.storageConfig.enabled && (self.storageConfig.provider === 'ipfs' || self.storageConfig.available_providers.indexOf('ipfs') >= 0)) {
        readFiles.push({
          filename: 'ipfs.js',
          content: fs.readFileSync(fs.embarkPath("js/ipfs.js")).toString(),
          path: fs.embarkPath("js/ipfs.js")
        });
      }

      if (self.communicationConfig.enabled && (self.communicationConfig.provider === 'orbit' || self.communicationConfig.available_providers.indexOf('orbit') >= 0)) {
        // TODO: remove duplicated files if functionality is the same for storage and orbit
        readFiles.push({
          filename: 'ipfs-api.js',
          content: fs.readFileSync(fs.embarkPath("js/ipfs-api.min.js")).toString(),
          path: fs.embarkPath("js/ipfs-api.min.js")
        });
        readFiles.push({
          filename: 'orbit.js',
          content: fs.readFileSync(fs.embarkPath("js/orbit.min.js")).toString(),
          path: fs.embarkPath("js/orbit.min.js")
        });
      }

      readFiles.push({
        filename: 'embark.js',
        content: fs.readFileSync(fs.embarkPath("js/build/embark.bundle.js")).toString(),
        path: fs.embarkPath("js/build/embark.bundle.js")
      });
    }
  });

  // get plugins
  let filesFromPlugins = [];

  let filePlugins = self.plugins.getPluginsFor('pipelineFiles');

  if (filePlugins.length > 0) {
    filePlugins.forEach(function (plugin) {
      try {
        let fileObjects = plugin.runFilePipeline();
        for (let i = 0; i < fileObjects.length; i++) {
          let fileObject = fileObjects[i];
          filesFromPlugins.push(fileObject);
        }
      }
      catch (err) {
        self.logger.error(err.message);
      }
    });
  }

  filesFromPlugins.filter(function (file) {
    if (utils.fileMatchesPattern(files, file.intendedPath)) {
      readFiles.push(file);
    }
  });

  // get user files
  originalFiles.filter(function (file) {
    return file.indexOf('.') >= 0;
  }).filter(function (file) {
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

Config.prototype.loadPluginContractFiles = function () {
  let self = this;

  let contractsPlugins = this.plugins.getPluginsFor('contractFiles');
  if (contractsPlugins.length > 0) {
    contractsPlugins.forEach(function (plugin) {
      plugin.contractsFiles.forEach(function (file) {
        let filename = file.replace('./', '');
        self.contractsFiles.push({
          filename: filename,
          content: plugin.loadPluginFile(file),
          path: plugin.pathToFile(file)
        });
      });
    });
  }
};

module.exports = Config;

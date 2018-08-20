const fs = require('./fs.js');
const File = require('./file.js');
const Plugins = require('./plugins.js');
const utils = require('../utils/utils.js');
const path = require('path');
const deepEqual = require('deep-equal');
const constants = require('../constants');
const {canonicalHost, defaultHost} = require('../utils/host');

var Config = function(options) {
  const self = this;
  this.env = options.env;
  this.blockchainConfig = {};
  this.contractsConfig  = {};
  this.pipelineConfig   = {};
  this.webServerConfig  = options.webServerConfig;
  this.chainTracker     = {};
  this.assetFiles = {};
  this.contractsFiles = [];
  this.configDir = options.configDir || 'config/';
  this.chainsFile = options.chainsFile || './chains.json';
  this.plugins = options.plugins;
  this.logger = options.logger;
  this.events = options.events;
  this.embarkConfig = {};
  this.context = options.context || [constants.contexts.any];

  self.events.setCommandHandler("config:contractsConfig", (cb) => {
    cb(self.contractsConfig);
  });

  self.events.setCommandHandler("config:contractsFiles", (cb) => {
    cb(self.contractsFiles);
  });

  // TODO: refactor this so reading the file can be done with a normal resolver or something that takes advantage of the plugin api
  self.events.setCommandHandler("config:contractsFiles:add", (filename) => {
    self.contractsFiles.push(new File({filename: filename, type: File.types.custom, path: filename, resolver: function(callback) {
      callback(fs.readFileSync(filename).toString());
    }}));
  });
};

Config.prototype.loadConfigFiles = function(options) {
  var interceptLogs = options.interceptLogs;
  if (options.interceptLogs === undefined) {
    interceptLogs = true;
  }

  if (!fs.existsSync(options.embarkConfig)){
    this.logger.error(__('Cannot find file %s Please ensure you are running this command inside the Dapp folder', options.embarkConfig));
    process.exit(1);
  }

  this.embarkConfig = fs.readJSONSync(options.embarkConfig);
  this.embarkConfig.plugins = this.embarkConfig.plugins || {};

  this.plugins = new Plugins({plugins: this.embarkConfig.plugins, logger: this.logger, interceptLogs: interceptLogs, events: this.events, config: this, context: this.context, env: this.env});
  this.plugins.loadPlugins();

  this.loadEmbarkConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadCommunicationConfigFile();
  this.loadNameSystemConfigFile();

  this.loadContractsConfigFile();
  this.loadPipelineConfigFile();

  this.loadContractsConfigFile();
  this.loadExternalContractsFiles();
  this.loadWebServerConfigFile();
  this.loadChainTrackerFile();
  this.loadPluginContractFiles();

  this._updateBlockchainCors();
};

Config.prototype.reloadConfig = function() {
  this.loadEmbarkConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadCommunicationConfigFile();
  this.loadNameSystemConfigFile();
  this.loadContractsConfigFile();
  this.loadPipelineConfigFile();
  this.loadContractsConfigFile();
  this.loadExternalContractsFiles();
  this.loadChainTrackerFile();

  this._updateBlockchainCors();
};

Config.prototype._updateBlockchainCors = function(){
  let blockchainConfig = this.blockchainConfig;
  let storageConfig = this.storageConfig;
  let webServerConfig = this.webServerConfig;
  let corsParts = [];

  if(webServerConfig && webServerConfig.enabled) {
    if(webServerConfig.host) corsParts.push(utils.buildUrlFromConfig(webServerConfig));
  }
  if(storageConfig && storageConfig.enabled) {
    // if getUrl is specified in the config, that needs to be included in cors
    // instead of the concatenated protocol://host:port
    if(storageConfig.upload.getUrl) {
      // remove /ipfs or /bzz: from getUrl if it's there
      let getUrlParts = storageConfig.upload.getUrl.split('/');
      getUrlParts = getUrlParts.slice(0, 3);
      let host = canonicalHost(getUrlParts[2].split(':')[0]);
      let port = getUrlParts[2].split(':')[1];
      getUrlParts[2] = port ? [host, port].join(':') : host;
      corsParts.push(getUrlParts.join('/'));
    }
    // use our modified getUrl or in case it wasn't specified, use a built url
    else{
      corsParts.push(utils.buildUrlFromConfig(storageConfig.upload));
    }
  }
  // add whisper cors
  if(this.communicationConfig && this.communicationConfig.enabled && this.communicationConfig.provider === 'whisper'){
    corsParts.push('embark');
  }

  let cors = corsParts.join(',');
  if(blockchainConfig.rpcCorsDomain === 'auto'){ 
    if(cors.length) blockchainConfig.rpcCorsDomain = cors;
    else blockchainConfig.rpcCorsDomain = '';
  }
  if(blockchainConfig.wsOrigins === 'auto'){ 
    if(cors.length) blockchainConfig.wsOrigins = cors;
    else blockchainConfig.wsOrigins = '';
  }
};

Config.prototype._mergeConfig = function(configFilePath, defaultConfig, env, enabledByDefault) {
  if (!configFilePath) {
    let configToReturn = defaultConfig['default'] || {};
    configToReturn.enabled = enabledByDefault || false;
    return configToReturn;
  }

  // due to embark.json; TODO: refactor this
  configFilePath = configFilePath.replace('.json','').replace('.js', '');
  if (!fs.existsSync(configFilePath + '.js') && !fs.existsSync(configFilePath + '.json')) {
    // TODO: remove this if
    if (this.logger) {
      this.logger.warn(__("no config file found at %s using default config", configFilePath));
    }
    return defaultConfig['default'] || {};
  }

  let config;
  if (fs.existsSync(configFilePath + '.js')) {
    config = require(fs.dappPath(configFilePath + '.js'));
  } else {
    config = fs.readJSONSync(configFilePath + '.json');
  }
  let configObject = utils.recursiveMerge(defaultConfig, config);

  if (env) {
    return utils.recursiveMerge(configObject['default'] || {}, configObject[env]);
  } else {
    return configObject;
  }
};

Config.prototype._getFileOrOject = function(object, filePath, property) {
  if (typeof (this.configDir) === 'object') {
    return this.configDir[property];
  }
  return this.configDir + filePath;
};

Config.prototype.loadBlockchainConfigFile = function() {
  var configObject = {
    "default": {
      "enabled": true,
      "rpcCorsDomain": "auto",
      "wsOrigins": "auto"
    }
  };

  let configFilePath = this._getFileOrOject(this.configDir, 'blockchain', 'blockchain');

  this.blockchainConfig = this._mergeConfig(configFilePath, configObject, this.env, true);
  if (!configFilePath) {
    this.blockchainConfig.default = true;
  }
};

Config.prototype.loadContractsConfigFile = function() {
  var defaultVersions = {
    "web3": "1.0.0-beta",
    "solc": "0.4.17"
  };
  var versions = utils.recursiveMerge(defaultVersions, this.embarkConfig.versions || {});

  var configObject = {
    "default": {
      "versions": versions,
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

  let configFilePath = this._getFileOrOject(this.configDir, 'contracts', 'contracts');

  const newContractsConfig = this._mergeConfig(configFilePath, configObject, this.env);

  if (!deepEqual(newContractsConfig, this.contractsConfig)) {
    this.contractsConfig = newContractsConfig;
  }
};

Config.prototype.loadExternalContractsFiles = function() {
  let contracts = this.contractsConfig.contracts;
  for (let contractName in contracts) {
    let contract = contracts[contractName];
    if (!contract.file) {
      continue;
    }
    if (contract.file.startsWith('http') || contract.file.startsWith('git')) {
      const fileObj = utils.getExternalContractUrl(contract.file);
      if (!fileObj) {
        return this.logger.error(__("HTTP contract file not found") + ": " + contract.file);
      }
      const localFile = fileObj.filePath;
      this.contractsFiles.push(new File({filename: localFile, type: File.types.http, basedir: '', path: fileObj.url}));
    } else if (fs.existsSync(contract.file)) {
      this.contractsFiles.push(new File({filename: contract.file, type: File.types.dapp_file, basedir: '', path: contract.file}));
    } else if (fs.existsSync(path.join('./node_modules/', contract.file))) {
      this.contractsFiles.push(new File({filename: path.join('./node_modules/', contract.file), type: File.types.dapp_file, basedir: '', path: path.join('./node_modules/', contract.file)}));
    } else {
      this.logger.error(__("contract file not found") + ": " + contract.file);
    }
  }
};

Config.prototype.loadStorageConfigFile = function() {
  var versions = utils.recursiveMerge({"ipfs-api": "17.2.4"}, this.embarkConfig.versions || {});

  var configObject = {
    "default": {
      "versions": versions,
      "enabled": true,
      "available_providers": ["ipfs", "swarm"],
      "ipfs_bin": "ipfs",
      "upload": {
        "provider": "ipfs",
        "protocol": "http",
        "host" : defaultHost,
        "port": 5001,
        "getUrl": "http://localhost:8080/ipfs/"
      },
      "dappConnection": [{"provider": "ipfs", "host": "localhost", "port": 5001, "getUrl": "http://localhost:8080/ipfs/"}]
    }
  };

  let configFilePath = this._getFileOrOject(this.configDir, 'storage', 'storage');

  this.storageConfig = this._mergeConfig(configFilePath, configObject, this.env);
};

Config.prototype.loadNameSystemConfigFile = function() {
  // todo: spec out names for registration in the file itself for a dev chain
  var configObject = {
    "default": {
      "available_providers": ["ens"],
      "provider": "ens",
      "enabled": true
    }
  };

  let configFilePath = this._getFileOrOject(this.configDir, 'namesystem', 'namesystem');

  this.namesystemConfig = this._mergeConfig(configFilePath, configObject, this.env);
};

Config.prototype.loadCommunicationConfigFile = function() {
  var configObject = {
    "default": {
      "enabled": true,
      "provider": "whisper",
      "available_providers": ["whisper"],
      "connection": {
        "host": defaultHost,
        "port": 8546,
        "type": "ws"
      }
    }
  };

  let configFilePath = this._getFileOrOject(this.configDir, 'communication', 'communication');

  this.communicationConfig = this._mergeConfig(configFilePath, configObject, this.env);
};

Config.prototype.loadWebServerConfigFile = function() {
  var configObject = {
    "enabled": true,
    "host": defaultHost,
    "port": 8000
  };

  let configFilePath = this._getFileOrOject(this.configDir, 'webserver', 'webserver');

  let webServerConfig = this._mergeConfig(configFilePath, configObject, false);

  if (this.webServerConfig) {
    // cli falgs to `embark run` should override configFile and defaults (configObject)
    this.webServerConfig = utils.recursiveMerge(webServerConfig, this.webServerConfig);
  } else {
    this.webServerConfig = webServerConfig;
  }
};

Config.prototype.loadEmbarkConfigFile = function() {
  var configObject = {
    options: {
      solc: {
        "optimize": true,
        "optimize-runs": 200
      }
    }
  };

  this.embarkConfig = utils.recursiveMerge(configObject, this.embarkConfig);

  const contracts = this.embarkConfig.contracts;
  const newContractsFiles = this.loadFiles(contracts);
  if (!this.contractFiles || newContractsFiles.length !== this.contractFiles.length || !deepEqual(newContractsFiles, this.contractFiles)) {
    this.contractsFiles = this.contractsFiles.concat(newContractsFiles).filter((file, index, arr) => {
      return !arr.some((file2, index2) => {
        return file.filename === file2.filename && index < index2;
      });
    });
  }
  // determine contract 'root' directories
  this.contractDirectories = contracts.map((dir) => {
    return dir.split("**")[0];
  }).map((dir) => {
    return dir.split("*.")[0];
  });
  this.contractDirectories.push(constants.httpContractsDirectory);

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
    this.logger.info(this.chainsFile + ' ' + __('file not found, creating it...'));
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
    readFiles.push(new File({filename: file, type: File.types.dapp_file, basedir: basedir, path: file}));
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
    if ((file.intendedPath && utils.fileMatchesPattern(files, file.intendedPath)) || utils.fileMatchesPattern(files, file.file)) {
      readFiles.push(file);
    }
  });

  return readFiles;
};

// NOTE: this doesn't work for internal modules
Config.prototype.loadPluginContractFiles = function() {
  var self = this;

  var contractsPlugins = this.plugins.getPluginsFor('contractFiles');
  contractsPlugins.forEach(function(plugin) {
    plugin.contractsFiles.forEach(function(file) {
      var filename = file.replace('./','');
      self.contractsFiles.push(new File({filename: filename, type: File.types.custom, path: filename, resolver: function(callback) {
        callback(plugin.loadPluginFile(file));
      }}));
    });
  });
};

module.exports = Config;

const fs = require('./fs.js');
const File = require('./file.js');
const utils = require('../utils/utils.js');
const path = require('path');
const deepEqual = require('deep-equal');
const constants = require('../constants');
const Events = require('./events');
const Logger = require('./logger');
const inversify = require('inversify');

class Config {

  constructor(logger, events, context, embarkConfigFile, env, configDir, chainsFile, autoLoadAllConfigs) {
    this.logger = logger;
    this.events = events;
    this.env = env || 'development';
    this.embarkConfigFile = embarkConfigFile || 'embark.json';

    this.blockchainConfig = {};
    this.contractsConfig  = {};
    this.pipelineConfig   = {};
    this.webServerConfig  = {};
    this.chainTracker     = {};
    this.assetFiles = {};
    this.contractsFiles = [];
    this.contractDirectories = [];
    this.configDir = configDir || 'config/';
    this.chainsFile = chainsFile || './chains.json';
    this.embarkConfig = {};
    this.context = context || [constants.contexts.any];

    // auto load config files (undefined should == true, false for unit testing) 
    // TODO: bad design! load config files needed per command
    if(autoLoadAllConfigs === undefined || autoLoadAllConfigs){
      this.loadConfigFiles();
    }
  }
  
  loadConfigFiles() {

    if (!fs.existsSync(this.embarkConfigFile)) {
      this.logger.error('Cannot find file ' + this.embarkConfigFile + '. Please ensure you are running this command inside the Dapp folder');
      process.exit(1);
    }

    this.embarkConfig = fs.readJSONSync(this.embarkConfigFile);
    this.embarkConfig.plugins = this.embarkConfig.plugins || {};

    this.loadEmbarkConfigFile();
    this.loadBlockchainConfigFile();
    this.loadStorageConfigFile();
    this.loadCommunicationConfigFile();

    this.loadContractsConfigFile();
    this.loadPipelineConfigFile();

    this.loadContractsConfigFile();
    this.loadExternalContractsFiles();
    this.loadWebServerConfigFile();
    this.loadChainTrackerFile();
    this.loadPluginContractFiles();
  }

  reloadConfig() {
    this.loadEmbarkConfigFile();
    this.loadBlockchainConfigFile();
    this.loadStorageConfigFile();
    this.loadCommunicationConfigFile();
    this.loadContractsConfigFile();
    this.loadPipelineConfigFile();
    this.loadContractsConfigFile();
    this.loadExternalContractsFiles();
    this.loadChainTrackerFile();
  }

  _mergeConfig (configFilePath, defaultConfig, env, enabledByDefault) {
    if (!configFilePath) {
      let configToReturn = defaultConfig['default'] || {};
      configToReturn.enabled = enabledByDefault || false;
      return configToReturn;
    }

    if (!fs.existsSync(configFilePath)) {
      // TODO: remove this if
      if (this.logger) {
        this.logger.warn("no config file found at " + configFilePath + ". using default config");
      }
      return defaultConfig['default'] || {};
    }

    let config = fs.readJSONSync(configFilePath);
    let configObject = utils.recursiveMerge(defaultConfig, config);

    if (env) {
      return utils.recursiveMerge(configObject['default'] || {}, configObject[env]);
    } else {
      return configObject;
    }
  }

  _getFileOrOject(object, filePath, property) {
    if (typeof (this.configDir) === 'object') {
      return this.configDir[property];
    }
    return this.configDir + filePath;
  }

  loadBlockchainConfigFile() {
    var configObject = {
      "default": {
        "enabled": true,
        "rpcCorsDomain": "auto",
        "wsOrigins": "auto"
      }
    };

    let configFilePath = this._getFileOrOject(this.configDir, 'blockchain.json', 'blockchain');

    this.blockchainConfig = this._mergeConfig(configFilePath, configObject, this.env, true);
  }

  loadContractsConfigFile() {
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

    var contractsConfigs = [];//.getPluginsProperty('contractsConfig', 'contractsConfigs');
    contractsConfigs.forEach(function (pluginConfig) {
      configObject = utils.recursiveMerge(configObject, pluginConfig);
    });

    let configFilePath = this._getFileOrOject(this.configDir, 'contracts.json', 'contracts');

    const newContractsConfig = this._mergeConfig(configFilePath, configObject, this.env);

    if (!deepEqual(newContractsConfig, this.contractsConfig)) {
      this.events.emit(constants.events.contractConfigChanged, newContractsConfig);
      this.contractsConfig = newContractsConfig;
    }
  }

  loadExternalContractsFiles() {
    let contracts = this.contractsConfig.contracts;
    for (let contractName in contracts) {
      let contract = contracts[contractName];
      if (!contract.file) {
        continue;
      }
      if (contract.file.startsWith('http') || contract.file.startsWith('git')) {
        const fileObj = utils.getExternalContractUrl(contract.file);
        if (!fileObj) {
          return this.logger.error("HTTP contract file not found: " + contract.file);
        }
        const localFile = fileObj.filePath;
        this.contractsFiles.push(new File({filename: localFile, type: File.types.http, basedir: '', path: fileObj.url}));
      } else if (fs.existsSync(contract.file)) {
        this.contractsFiles.push(new File({filename: contract.file, type: File.types.dapp_file, basedir: '', path: contract.file}));
      } else if (fs.existsSync(path.join('./node_modules/', contract.file))) {
        this.contractsFiles.push(new File({filename: path.join('./node_modules/', contract.file), type: File.types.dapp_file, basedir: '', path: path.join('./node_modules/', contract.file)}));
      } else {
        this.logger.error("contract file not found: " + contract.file);
      }
    }
  }

  loadStorageConfigFile() {
    var versions = utils.recursiveMerge({"ipfs-api": "17.2.4"}, this.embarkConfig.versions || {});

    var configObject = {
      "default": {
        "versions": versions,
        "enabled": true,
        "available_providers": ["ipfs", "swarm"],
        "ipfs_bin": "ipfs",
        "provider": "ipfs",
        "protocol": "http",
        "host": "localhost",
        "port": 5001,
        "getUrl": "http://localhost:8080/ipfs/"
      }
    };

    let configFilePath = this._getFileOrOject(this.configDir, 'storage.json', 'storage');

    this.storageConfig = this._mergeConfig(configFilePath, configObject, this.env);
  }

  loadCommunicationConfigFile() {
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

    let configFilePath = this._getFileOrOject(this.configDir, 'communication.json', 'communication');

    this.communicationConfig = this._mergeConfig(configFilePath, configObject, this.env);
  }

  loadWebServerConfigFile() {
    var configObject = {
      "enabled": true, "host": "localhost", "port": 8000
    };

    let configFilePath = this._getFileOrOject(this.configDir, 'webserver.json', 'webserver');

    this.webServerConfig = this._mergeConfig(configFilePath, configObject, false);
  }

  loadEmbarkConfigFile() {
    const contracts = this.embarkConfig.contracts;
    const newContractsFiles = this.loadFiles(contracts);
    if (!this.contractFiles || newContractsFiles.length !== this.contractFiles.length || !deepEqual(newContractsFiles, this.contractFiles)) {
      this.events.emit(constants.events.contractFilesChanged, newContractsFiles);
      this.contractsFiles = newContractsFiles;
    }
    // determine contract 'root' directories
    this.contractDirectories = contracts.map((dir) => {
      return dir.split("**")[0];
    }).map((dir) => {
      return dir.split("*.")[0];
    });
    this.contractDirectories.push(constants.httpContractsDirectory);

    this.buildDir = this.embarkConfig.buildDir;
    this.configDir = this.embarkConfig.config;
  }

  loadPipelineConfigFile() {
    var assets = this.embarkConfig.app;
    for (var targetFile in assets) {
      this.assetFiles[targetFile] = this.loadFiles(assets[targetFile]);
    }
  }

  loadChainTrackerFile() {
    if (!fs.existsSync(this.chainsFile)) {
      this.logger.info(this.chainsFile + ' file not found, creating it...');
      fs.writeJSONSync(this.chainsFile, {});
    }

    this.chainTracker = fs.readJSONSync(this.chainsFile);
  }

  _findMatchingExpression(filename, filesExpressions) {
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

  loadFiles(files) {
    var self = this;
    var originalFiles = utils.filesMatchingPattern(files);
    var readFiles = [];

    originalFiles.filter(function (file) {
      return (file[0] === '$' || file.indexOf('.') >= 0);
    }).filter(function (file) {
      let basedir = self._findMatchingExpression(file, files);
      readFiles.push(new File({filename: file, type: File.types.dapp_file, basedir: basedir, path: file}));
    });

    var filesFromPlugins = [];
    var filePlugins = [];//self.plugins.getPluginsFor('pipelineFiles');
    filePlugins.forEach(function (plugin) {
      try {
        var fileObjects = plugin.runFilePipeline();
        for (var i = 0; i < fileObjects.length; i++) {
          var fileObject = fileObjects[i];
          filesFromPlugins.push(fileObject);
        }
      }
      catch (err) {
        self.logger.error(err.message);
      }
    });
    filesFromPlugins.filter(function (file) {
      if ((file.intendedPath && utils.fileMatchesPattern(files, file.intendedPath)) || utils.fileMatchesPattern(files, file.file)) {
        readFiles.push(file);
      }
    });

    return readFiles;
  }

  loadPluginContractFiles() {
    var self = this;

    var contractsPlugins = [];//this.plugins.getPluginsFor('contractFiles');
    contractsPlugins.forEach(function (plugin) {
      plugin.contractsFiles.forEach(function (file) {
        var filename = file.replace('./', '');
        self.contractsFiles.push(new File({
          filename: filename, type: File.types.custom, path: filename, resolver: function (callback) {
            callback(plugin.loadPluginFile(file));
          }
        }));
      });
    });
  }
}

inversify.decorate(inversify.injectable(), Config);
inversify.decorate(inversify.inject(Logger), Config, 0);
inversify.decorate(inversify.inject(Events), Config, 1);
inversify.decorate(inversify.inject('context'), Config, 2);
inversify.decorate(inversify.inject('embarkConfigFile'), Config, 3);
inversify.decorate(inversify.optional(), Config, 3);
inversify.decorate(inversify.inject('env'), Config, 4);
inversify.decorate(inversify.optional(), Config, 4);
inversify.decorate(inversify.inject('configDir'), Config, 5);
inversify.decorate(inversify.optional(), Config, 5);
inversify.decorate(inversify.inject('chainsFile'), Config, 6);
inversify.decorate(inversify.optional(), Config, 6);
inversify.decorate(inversify.inject('autoLoadAllConfigs'), Config, 7);
inversify.decorate(inversify.optional(), Config, 7);

module.exports = Config;

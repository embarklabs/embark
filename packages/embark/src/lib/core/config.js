const fs = require('./fs.js');
const Plugins = require('./plugins.js');
const utils = require('../utils/utils.js');
const path = require('path');
const deepEqual = require('deep-equal');
const web3 = require('web3');
const constants = require('embark-core/constants');
import { __ } from 'embark-i18n';
import {
  buildUrlFromConfig,
  canonicalHost,
  dappPath,
  defaultHost,
  File,
  Types,
  recursiveMerge,
  AddressUtils,
  unitRegex,
  getWeiBalanceFromString,
  prepareContractsConfig,
  getExternalContractUrl
} from 'embark-utils';
const cloneDeep = require('lodash.clonedeep');
const { replaceZeroAddressShorthand } = AddressUtils;

const DEFAULT_CONFIG_PATH = 'config/';
const PACKAGE = require('../../../package.json');

var Config = function(options) {
  const self = this;
  this.env = options.env || 'default';
  this.blockchainConfig = {};
  this.contractsConfig  = {};
  this.pipelineConfig   = {};
  this.webServerConfig  = options.webServerConfig;
  this.chainTracker     = {};
  this.assetFiles = {};
  this.contractsFiles = [];
  this.configDir = options.configDir || DEFAULT_CONFIG_PATH;
  this.chainsFile = options.chainsFile || './chains.json';
  this.plugins = options.plugins;
  this.logger = options.logger;
  this.package = PACKAGE;
  this.events = options.events;
  this.embarkConfig = {};
  this.context = options.context || [constants.contexts.any];
  this.version = options.version;
  this.shownNoAccountConfigMsg = false; // flag to ensure "no account config" message is only displayed once to the user
  this.corsParts = [];
  this.providerUrl = null;
  this.events.setCommandHandler("config:cors:add", (url) => {
    this.corsParts.push(url);
    this._updateBlockchainCors();
  });

  self.events.setCommandHandler("config:contractsConfig", (cb) => {
    cb(self.contractsConfig);
  });

  self.events.setCommandHandler("config:contractsConfig:set", (config, cb) => {
    self.contractsConfig = config;
    cb();
  });

  self.events.setCommandHandler("config:contractsFiles", (cb) => {
    cb(self.contractsFiles);
  });

  // TODO: refactor this so reading the file can be done with a normal resolver or something that takes advantage of the plugin api
  self.events.setCommandHandler("config:contractsFiles:add", (filename, resolver) => {
    resolver = resolver || function(callback) {
      callback(fs.readFileSync(filename).toString());
    };
    self.contractsFiles.push(new File({path: filename, originalPath: filename, type: Types.custom, resolver}));
  });

  self.events.setCommandHandler("config:contractsFiles:reset", (cb) => {
    self.contractsFiles.forEach((file) => {
      if(file.path.includes(".embark")) {
        fs.removeSync(file.path);
      }
      self.contractsFiles = self.contractsFiles.filter((contractFile) => contractFile.path !== file.path);
    });
    cb();
  });

  self.events.on('file-remove', (fileType, removedPath) => {
    if(fileType !== 'contract') return;
    const normalizedPath = path.normalize(removedPath);
    self.contractsFiles = self.contractsFiles.filter(file => path.normalize(file.path) !== normalizedPath);
  });
};

// TODO remove this at some point as it is now in plugin
Config.prototype.dappPath = dappPath;

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

  this.plugins = new Plugins({
    plugins: this.embarkConfig.plugins,
    logger: this.logger,
    interceptLogs: interceptLogs,
    events: this.events,
    config: this,
    context: this.context,
    env: this.env,
    version: this.version
  });
  this.plugins.loadPlugins();

  this.loadEmbarkConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadContractFiles();
  this.loadCommunicationConfigFile();
  this.loadNameSystemConfigFile();
  this.loadPipelineConfigFile();
  this.loadAssetFiles();
  this.loadContractsConfigFile();
  this.loadExternalContractsFiles();
  this.loadWebServerConfigFile();
  this.loadPluginContractFiles();

  this._updateBlockchainCors();
};

Config.prototype.reloadConfig = function() {
  this.loadEmbarkConfigFile();
  this.loadBlockchainConfigFile();
  this.loadStorageConfigFile();
  this.loadContractFiles();
  this.loadCommunicationConfigFile();
  this.loadNameSystemConfigFile();
  this.loadPipelineConfigFile();
  this.loadAssetFiles();
  this.loadContractsConfigFile();
  this.loadExternalContractsFiles();

  this._updateBlockchainCors();
};

Config.prototype.loadContractFiles = function() {
  const loadedContractFiles = this.loadFiles(this.embarkConfig.contracts);
  // `this.contractsFiles` could've been mutated at runtime using
  // either `config:contractsFiles:add` event or through calls to
  // `loadExternalContractsFiles()`, so we have to make sure we preserve
  // those added files before we reset `this.contractsFiles`.
  //
  // We do that by determining the difference between `loadedContractFiles` and the ones
  // already in memory in `this.contractsFiles`.
  const addedContractFiles = this.contractsFiles.filter(existingFile => !loadedContractFiles.some(file => file.originalPath === existingFile.originalPath));
  this.contractsFiles = loadedContractFiles.concat(addedContractFiles);
};

Config.prototype._updateBlockchainCors = function(){
  let blockchainConfig = this.blockchainConfig;
  let storageConfig = this.storageConfig;
  let webServerConfig = this.webServerConfig;
  let corsParts = cloneDeep(this.corsParts);

  if (blockchainConfig.isDev) {
    corsParts.push('*');
  }

  if(webServerConfig && webServerConfig.host) {
    corsParts.push(buildUrlFromConfig(webServerConfig));
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
      corsParts.push(buildUrlFromConfig(storageConfig.upload));
    }
  }
  // Add cors for the proxy and whisper
  corsParts.push(constants.embarkResourceOrigin);

  corsParts = Array.from(new Set(corsParts));
  this.corsParts = corsParts;

  let cors = corsParts.join(',');
  if (blockchainConfig.rpcCorsDomain === 'auto') {
    blockchainConfig.rpcCorsDomain = cors;
  } else if (typeof blockchainConfig.rpcCorsDomain === 'object') {
    let tempCors = blockchainConfig.rpcCorsDomain.auto ? corsParts : [];
    tempCors = tempCors.concat(blockchainConfig.rpcCorsDomain.additionalCors || []);
    blockchainConfig.rpcCorsDomain = tempCors.join(',');
  }
  if (blockchainConfig.wsOrigins === 'auto') {
    blockchainConfig.wsOrigins = cors;
  } else if (typeof blockchainConfig.wsOrigins === 'object') {
    let tempCors = blockchainConfig.wsOrigins.auto ? corsParts : [];
    tempCors = tempCors.concat(blockchainConfig.wsOrigins.additionalCors || []);
    blockchainConfig.wsOrigins = tempCors.join(',');
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
    delete require.cache[configFilePath + '.js'];
    config = require(configFilePath + '.js');
  } else {
    config = fs.readJSONSync(configFilePath + '.json');
  }
  let configObject = recursiveMerge(defaultConfig, config);

  if (env) {
    return recursiveMerge(configObject['default'] || {}, configObject[env]);
  }
  return configObject;
};

Config.prototype._getFileOrObject = function(object, filePath, property) {
  if (typeof object === 'object') {
    return object[property] ? dappPath(object[property]) : object[property];
  }
  return dappPath(object, filePath);
};

Config.prototype.loadBlockchainConfigFile = function() {
  var configObject = {
    default: {
      enabled: true,
      ethereumClientName: constants.blockchain.clients.geth,
      rpcCorsDomain: "auto",
      wsOrigins: "auto",
      proxy: true,
      datadir: '.embark/' + this.env + '/datadir'
    }
  };

  let configFilePath = this._getFileOrObject(this.configDir, 'blockchain', 'blockchain');

  this.blockchainConfig = this._mergeConfig(configFilePath, configObject, this.env, true);
  if (!configFilePath) {
    this.blockchainConfig.default = true;
  }

  if (this.blockchainConfig.targetGasLimit && this.blockchainConfig.targetGasLimit.toString().match(unitRegex)) {
    this.blockchainConfig.targetGasLimit = getWeiBalanceFromString(this.blockchainConfig.targetGasLimit, web3);
  }

  if (this.blockchainConfig.gasPrice && this.blockchainConfig.gasPrice.toString().match(unitRegex)) {
    this.blockchainConfig.gasPrice = getWeiBalanceFromString(this.blockchainConfig.gasPrice, web3);
  }

  if (this.blockchainConfig.accounts) {
    this.blockchainConfig.accounts.forEach(acc => {
      if (acc.balance && acc.balance.toString().match(unitRegex)) {
        acc.balance = getWeiBalanceFromString(acc.balance, web3);
      }
    });
  }

  if (
    !this.shownNoAccountConfigMsg &&
    (/rinkeby|testnet|livenet/).test(this.blockchainConfig.networkType) &&
    !(this.blockchainConfig.accounts && this.blockchainConfig.accounts.find(acc => acc.password)) &&
    !this.blockchainConfig.isDev &&
    this.env !== 'development' && this.env !== 'test') {
    this.logger.warn((
      '\n=== ' + __('Cannot unlock account - account config missing').bold + ' ===\n' +
      __('Geth is configured to sync to a testnet/livenet and needs to unlock an account ' +
        'to allow your dApp to interact with geth, however, the address and password must ' +
        'be specified in your blockchain config. Please update your blockchain config with ' +
        'a valid address and password: \n') +
      ` - config/blockchain.js > ${this.env} > account\n\n`.italic +
      __('Please also make sure the keystore file for the account is located at: ') +
      '\n - Mac: ' + `~/Library/Ethereum/${this.env}/keystore`.italic +
      '\n - Linux: ' + `~/.ethereum/${this.env}/keystore`.italic +
      '\n - Windows: ' + `%APPDATA%\\Ethereum\\${this.env}\\keystore`.italic) +
      __('\n\nAlternatively, you could change ' +
        `config/blockchain.js > ${this.env} > networkType`.italic +
        __(' to ') +
        '"custom"\n'.italic).yellow
    );
    this.shownNoAccountConfigMsg = true;
  }

  const accountDocsMessage = __('For more info, check the docs: %s', 'https://embark.status.im/docs/blockchain_accounts_configuration.html'.underline);
  if (this.blockchainConfig.account) {
    this.logger.error(__('The `account` config for the blockchain was removed. Please use `accounts` instead.'));
    this.logger.error(accountDocsMessage);
    process.exit(1);
  }

  if (this.blockchainConfig.simulatorMnemonic) {
    this.logger.error(__('The `simulatorMnemonic` config for the blockchain was removed. Please use `accounts` instead.'));
    this.logger.error(accountDocsMessage);
    process.exit(1);
  }

  this.events.emit('config:load:blockchain', this.blockchainConfig);
};

Config.prototype.loadContractsConfigFile = function() {
  var defaultVersions = {
    "web3": "1.0.0-beta",
    "solc": "0.5.0"
  };
  var versions = recursiveMerge(defaultVersions, this.embarkConfig.versions || {});

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
      "dappAutoEnable": true,
      "strategy": constants.deploymentStrategy.implicit,
      "gas": "auto",
      "contracts": {
      }
    }
  };

  var contractsConfigs = this.plugins.getPluginsProperty('contractsConfig', 'contractsConfigs');
  contractsConfigs.forEach(function(pluginConfig) {
    configObject = recursiveMerge(configObject, pluginConfig);
  });

  let configFilePath = this._getFileOrObject(this.configDir, 'contracts', 'contracts');
  let newContractsConfig = this._mergeConfig(configFilePath, configObject, this.env);
  if (newContractsConfig.gas.match(unitRegex)) {
    newContractsConfig.gas = getWeiBalanceFromString(newContractsConfig.gas, web3);
  }
  if (newContractsConfig.deployment && 'accounts' in newContractsConfig.deployment) {
    newContractsConfig.deployment.accounts.forEach((account) => {
      if (account.balance && account.balance.match(unitRegex)) {
        account.balance = getWeiBalanceFromString(account.balance, web3);
      }
    });
  }

  newContractsConfig = prepareContractsConfig(newContractsConfig);

  const afterDeploy = newContractsConfig.afterDeploy;

  if (Array.isArray(afterDeploy)) {
    newContractsConfig.afterDeploy = afterDeploy.map(replaceZeroAddressShorthand);
  }

  if (!deepEqual(newContractsConfig, this.contractsConfig)) {
    this.contractsConfig = newContractsConfig;
  }

  this.events.emit('config:load:contracts', this.contractsConfig);
};

Config.prototype.loadExternalContractsFiles = function() {
  let contracts = this.contractsConfig.contracts;
  let storageConfig = this.storageConfig;
  if (storageConfig && storageConfig.upload && storageConfig.upload.getUrl) {
      this.providerUrl = storageConfig.upload.getUrl;
  }
  for (let contractName in contracts) {
    let contract = contracts[contractName];

    if (!contract.file) {
      continue;
    }

    let externalContractFile = null;

    if (contract.file.startsWith('http') || contract.file.startsWith('git') || contract.file.startsWith('ipfs') || contract.file.startsWith('bzz')) {
      const fileObj = getExternalContractUrl(contract.file, this.providerUrl);
      if (!fileObj) {
        return this.logger.error(__("HTTP contract file not found") + ": " + contract.file);
      }
      externalContractFile = new File({ path: fileObj.filePath, originalPath: fileObj.filePath, type: Types.http, basedir: '', externalUrl: fileObj.url, storageConfig });
    } else if (fs.existsSync(contract.file)) {
      externalContractFile = new File({ path: contract.file, originalPath: contract.file, type: Types.dappFile, basedir: '', storageConfig });
    } else if (fs.existsSync(path.join('./node_modules/', contract.file))) {
      const completePath = path.join('./node_modules/', contract.file);
      externalContractFile = new File({ path: completePath, originalPath: completePath, type: Types.dappFile, basedir: '', storageConfig });
    }

    if (externalContractFile) {
      const index = this.contractsFiles.findIndex(contractFile => contractFile.originalPath === externalContractFile.originalPath);
      // It's important that we only add `externalContractFile` if it doesn't exist already
      // within `contractsFiles`, otherwise we keep adding duplicates in subsequent
      // compilation routines creating a memory leak.
      if (index > -1) {
        this.contractsFiles[index] = externalContractFile;
      } else {
        this.contractsFiles.push(externalContractFile);
      }
    } else {
      this.logger.error(__("contract file not found") + ": " + contract.file);
    }
  }
};

Config.prototype.loadStorageConfigFile = function() {
  var versions = recursiveMerge({"ipfs-api": "17.2.4"}, this.embarkConfig.versions || {});

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

  let configFilePath = this._getFileOrObject(this.configDir, 'storage', 'storage');

  this.storageConfig = this._mergeConfig(configFilePath, configObject, this.env);
  this.events.emit('config:load:storage', this.storageConfig);
};

Config.prototype.loadNameSystemConfigFile = function() {
  // todo: spec out names for registration in the file itself for a dev chain
  var configObject = {
    "default": {
      "enabled": false
    }
  };

  let configFilePath = this._getFileOrObject(this.configDir, 'namesystem', 'namesystem');

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

  let configFilePath = this._getFileOrObject(this.configDir, 'communication', 'communication');

  this.communicationConfig = this._mergeConfig(configFilePath, configObject, this.env);
  this.events.emit('config:load:communication', this.communicationConfig);
};

Config.prototype.loadWebServerConfigFile = function() {
  var configObject = {
    "enabled": true,
    "host": defaultHost,
    "openBrowser": true,
    "port": 8000,
    "enableCatchAll": true,
    "protocol": "http"
  };

  let configFilePath = this._getFileOrObject(this.configDir, 'webserver', 'webserver');

  let webServerConfig = this._mergeConfig(configFilePath, configObject, false);

  if (webServerConfig.https){
    try {
      webServerConfig.certOptions = {
        key: fs.readFileSync(webServerConfig.key),
        cert: fs.readFileSync(webServerConfig.cert)
      };
      webServerConfig.protocol = 'https';
    } catch (e) {
      this.logger.error(e.message);
      this.logger.warn('Invalid path for key/cert in config/webserver.js. Using http instead.');
      webServerConfig.certOptions = {};
      webServerConfig.protocol = 'http';
    }
  }
  if (configFilePath === false) {
    this.webServerConfig = {enabled: false};
    return;
  }
  if (this.webServerConfig) {
    // cli flags to `embark run` should override configFile and defaults (configObject)
    this.webServerConfig = recursiveMerge(webServerConfig, this.webServerConfig);
  } else {
    this.webServerConfig = webServerConfig;
  }

  this.events.emit('config:load:webserver', this.webServerConfig);
};

Config.prototype.loadEmbarkConfigFile = function() {
  var configObject = {
    options: {
      solc: {
        "optimize": true,
        "optimize-runs": 200
      }
    },
    "generationDir": "embarkArtifacts"
  };

  this.embarkConfig = recursiveMerge(configObject, this.embarkConfig);

  const contracts = this.embarkConfig.contracts;
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

  const defaultPipelineConfig = {
    typescript: false,
    enabled: true
  };

  let pipelineConfigPath = this._getFileOrObject(this.configDir, 'pipeline', 'pipeline');

  // Embark applications in "simple" mode that aren't aware of `pipeline.js` configuration capabilities
  // won't have a pipeline config path so we need to perform this safety check here, otherwise the
  // next expression is going to throw.
  if (pipelineConfigPath !== undefined) {
    // At this point, `pipelineConfigPath` could be either `config/pipeline` or a filepath including its extension.
    // We need to make sure that we always have an extension.
    pipelineConfigPath = `${dappPath(pipelineConfigPath)}${path.extname(pipelineConfigPath) === '.js' ? '' : '.js'}`;
  }

  let pipelineConfig = defaultPipelineConfig;

  if (pipelineConfigPath && fs.existsSync(pipelineConfigPath)) {
    delete require.cache[pipelineConfigPath];
    pipelineConfig = recursiveMerge(
      recursiveMerge(true, pipelineConfig),
      require(pipelineConfigPath)
    );
  }

  this.pipelineConfig = pipelineConfig;
  this.events.emit('config:load:pipeline', this.pipelineConfig);
};

Config.prototype.loadAssetFiles = function () {
  if(!this.embarkConfig.app) return;
  Object.keys(this.embarkConfig.app).forEach(targetFile => {
    this.assetFiles[targetFile] = this.loadFiles(this.embarkConfig.app[targetFile]);
  });
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
  let storageConfig = self.storageConfig;

  originalFiles.filter(function(file) {
    return (file[0] === '$' || file.indexOf('.') >= 0);
  }).filter(function(file) {
    let basedir = findMatchingExpression(file, files);
    readFiles.push(new File({path: file, originalPath: file, type: Types.dappFile, basedir: basedir, storageConfig: storageConfig}));
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
  let storageConfig = self.storageConfig;
  var contractsPlugins = this.plugins.getPluginsFor('contractFiles');
  contractsPlugins.forEach(function(plugin) {
    plugin.contractsFiles.forEach(function(file) {
      var filename = file.replace('./','');
      self.contractsFiles.push(new File({ path: filename, originalPath: path.join(plugin.pluginPath, filename), pluginPath: plugin.pluginPath, type: Types.custom, storageConfig,
        resolver: function(callback) {
          callback(plugin.loadPluginFile(file));
        }
      }));
    });
  });
};

module.exports = Config;

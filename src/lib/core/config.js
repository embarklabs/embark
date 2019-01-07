const fs = require('./fs.js');
const File = require('./file.js');
const Plugins = require('./plugins.js');
const utils = require('../utils/utils.js');
const path = require('path');
const deepEqual = require('deep-equal');
const web3 = require('web3');
const constants = require('../constants');
const {canonicalHost, defaultHost} = require('../utils/host');
const cloneDeep = require('lodash.clonedeep');
import { replaceZeroAddressShorthand } from '../utils/addressUtils';
import { unitRegex } from "../utils/regexConstants";
import * as utilsContractsConfig from "../utils/contractsConfig";

const DEFAULT_CONFIG_PATH = 'config/';

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
    self.contractsFiles.push(new File({filename, type: File.types.custom, path: filename, resolver}));
  });

  self.events.on('file-remove', (fileType, removedPath) => {
    if(fileType !== 'contract') return;
    const normalizedPath = path.normalize(removedPath);
    self.contractsFiles = self.contractsFiles.filter(file => path.normalize(file.filename) !== normalizedPath);
  });
};

Config.prototype.dappPath = fs.dappPath;

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

  this.plugins = new Plugins({plugins: this.embarkConfig.plugins, logger: this.logger, interceptLogs: interceptLogs, events: this.events, config: this, context: this.context, env: this.env, version: this.version});
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
  this.loadChainTrackerFile();
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
  this.loadChainTrackerFile();

  this._updateBlockchainCors();
};

Config.prototype.loadContractFiles = function() {
  const contracts = this.embarkConfig.contracts;
  const newContractsFiles = this.loadFiles(contracts);
  if (!this.contractFiles || newContractsFiles.length !== this.contractFiles.length || !deepEqual(newContractsFiles, this.contractFiles)) {
    this.contractsFiles = this.contractsFiles.concat(newContractsFiles).filter((file, index, arr) => {
      return !arr.some((file2, index2) => {
        return file.filename === file2.filename && index < index2;
      });
    });
  }
};

Config.prototype._updateBlockchainCors = function(){
  let blockchainConfig = this.blockchainConfig;
  let storageConfig = this.storageConfig;
  let webServerConfig = this.webServerConfig;
  let corsParts = cloneDeep(this.corsParts);

  if(webServerConfig && webServerConfig.host) {
    corsParts.push(utils.buildUrlFromConfig(webServerConfig));
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
  // Add cors for the proxy and whisper
  corsParts.push(constants.embarkResourceOrigin);

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
    delete require.cache[fs.dappPath(configFilePath + '.js')];
    config = require(fs.dappPath(configFilePath + '.js'));
  } else {
    config = fs.readJSONSync(configFilePath + '.json');
  }
  let configObject = utils.recursiveMerge(defaultConfig, config);

  if (env) {
    return utils.recursiveMerge(configObject['default'] || {}, configObject[env]);
  }
  return configObject;
};

Config.prototype._getFileOrOject = function(object, filePath, property) {
  if (typeof (this.configDir) === 'object') {
    return this.configDir[property];
  }
  return utils.joinPath(this.configDir, filePath);
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

  let configFilePath = this._getFileOrOject(this.configDir, 'blockchain', 'blockchain');

  this.blockchainConfig = this._mergeConfig(configFilePath, configObject, this.env, true);
  if (!configFilePath) {
    this.blockchainConfig.default = true;
  }

  if (this.blockchainConfig.targetGasLimit && this.blockchainConfig.targetGasLimit.toString().match(unitRegex)) {
    this.blockchainConfig.targetGasLimit = utils.getWeiBalanceFromString(this.blockchainConfig.targetGasLimit, web3);
  }

  if (this.blockchainConfig.gasPrice && this.blockchainConfig.gasPrice.toString().match(unitRegex)) {
    this.blockchainConfig.gasPrice = utils.getWeiBalanceFromString(this.blockchainConfig.gasPrice, web3);
  }

  if (this.blockchainConfig.accounts) {
    this.blockchainConfig.accounts.forEach(acc => {
      if (acc.balance && acc.balance.toString().match(unitRegex)) {
        acc.balance = utils.getWeiBalanceFromString(acc.balance, web3);
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
      "dappAutoEnable": true,
      "strategy": constants.deploymentStrategy.implicit,
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
  let newContractsConfig = this._mergeConfig(configFilePath, configObject, this.env);
  if (newContractsConfig.gas.match(unitRegex)) {
    newContractsConfig.gas = utils.getWeiBalanceFromString(newContractsConfig.gas, web3);
  }
  if (newContractsConfig.deployment && 'accounts' in newContractsConfig.deployment) {
    newContractsConfig.deployment.accounts.forEach((account) => {
      if (account.balance && account.balance.match(unitRegex)) {
        account.balance = utils.getWeiBalanceFromString(account.balance, web3);
      }
    });
  }

  newContractsConfig = utilsContractsConfig.prepare(newContractsConfig);
  
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
    if (contract.file.startsWith('http') || contract.file.startsWith('git') || contract.file.startsWith('ipfs') || contract.file.startsWith('bzz')) {
      const fileObj = utils.getExternalContractUrl(contract.file,this.providerUrl);
      if (!fileObj) {
        return this.logger.error(__("HTTP contract file not found") + ": " + contract.file);
      }
      const localFile = fileObj.filePath;
      this.contractsFiles.push(new File({filename: localFile, type: File.types.http, basedir: '', path: fileObj.url, storageConfig: storageConfig}));
    } else if (fs.existsSync(contract.file)) {
      this.contractsFiles.push(new File({filename: contract.file, type: File.types.dapp_file, basedir: '', path: contract.file, storageConfig: storageConfig}));
    } else if (fs.existsSync(path.join('./node_modules/', contract.file))) {
      this.contractsFiles.push(new File({filename: path.join('./node_modules/', contract.file), type: File.types.dapp_file, basedir: '', path: path.join('./node_modules/', contract.file), storageConfig: storageConfig}));
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
      "enabled": false
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
    "openBrowser": true,
    "port": 8000,
    "enableCatchAll": true,
    "protocol": "http" 
  };

  let configFilePath = this._getFileOrOject(this.configDir, 'webserver', 'webserver');

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
    this.webServerConfig = utils.recursiveMerge(webServerConfig, this.webServerConfig);
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
    }
  };

  this.embarkConfig = utils.recursiveMerge(configObject, this.embarkConfig);

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
    typescript: false
  };

  let pipelineConfigPath = this._getFileOrOject(this.configDir, 'pipeline', 'pipeline');

  // Embark applications in "simple" mode that aren't aware of `pipeline.js` configuration capabilities
  // won't have a pipeline config path so we need to perform this safety check here, otherwise the
  // next expression is going to throw.
  if (pipelineConfigPath !== undefined) {
    // At this point, `pipelineConfigPath` could be either `config/pipeline` or a filepath including its extension.
    // We need to make sure that we always have an extension.
    pipelineConfigPath = `${fs.dappPath(pipelineConfigPath)}${path.extname(pipelineConfigPath) === '.js' ? '' : '.js'}`;
  }

  let pipelineConfig = defaultPipelineConfig;

  if (pipelineConfigPath && fs.existsSync(pipelineConfigPath)) {
    delete require.cache[pipelineConfigPath];
    pipelineConfig = utils.recursiveMerge(
      utils.recursiveMerge(true, pipelineConfig),
      require(pipelineConfigPath)
    );
  }

  this.pipelineConfig = pipelineConfig;
};

Config.prototype.loadAssetFiles = function () {
  Object.keys(this.embarkConfig.app).forEach(targetFile => {
    this.assetFiles[targetFile] = this.loadFiles(this.embarkConfig.app[targetFile]);
  });
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
  let storageConfig = self.storageConfig;

  originalFiles.filter(function(file) {
    return (file[0] === '$' || file.indexOf('.') >= 0);
  }).filter(function(file) {
    let basedir = findMatchingExpression(file, files);
    readFiles.push(new File({filename: file, type: File.types.dapp_file, basedir: basedir, path: file, storageConfig: storageConfig}));
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
      self.contractsFiles.push(new File({filename: filename, pluginPath: plugin.pluginPath, type: File.types.custom, path: filename, storageConfig: storageConfig, resolver: function(callback) {
        callback(plugin.loadPluginFile(file));
      }}));
    });
  });
};

module.exports = Config;

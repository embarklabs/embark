import * as fs from './fs';
import { Plugins } from './plugins';
import { Plugin } from './plugin';
import { EmbarkEmitter as Events } from './events';
import { filesMatchingPattern, fileMatchesPattern } from './utils/utils';
const path = require('path');
const deepEqual = require('deep-equal');
import { __ } from 'embark-i18n';
import {
  buildUrlFromConfig,
  deconstructUrl,
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
import { Logger } from 'embark-logger';
const cloneDeep = require('lodash.clonedeep');
const { replaceZeroAddressShorthand } = AddressUtils;

import { getBlockchainDefaults, getContractDefaults } from './configDefaults';

const constants = require('../constants.json');

const DEFAULT_CONFIG_PATH = 'config/';

const embark5ChangesUrl = 'https://framework.embarklabs.io/docs/migrating_from_3.x.html#Updating-to-v5';

export interface EmbarkConfig {
  app?: any;
  contracts: string[];
  config: string;
  versions: {
    solc: string;
  };
  generationDir?: string;
  plugins?: any;
  buildDir?: string;
  migrations: string;
}

export class Config {

  env = 'default';

  blockchainConfig: any = {};

  contractsConfig: any = {};

  pipelineConfig: any = {};

  namesystemConfig: any = {};

  communicationConfig: any = {};

  webServerConfig: any;

  storageConfig: any;

  chainTracker: any = {};

  assetFiles: any = {};

  contractsFiles: File[] = [];

  configDir: string;

  chainsFile = './chains.json';

  plugins: Plugins;

  logger: Logger;

  package: any;

  events: Events;

  embarkConfig: EmbarkConfig = constants.defaultEmbarkConfig;

  context: any;

  version: string;

  locale: string;

  corsParts: string[] = [];

  providerUrl = '';

  contractDirectories: string[] = [];

  buildDir: any;

  client: string;

  dappPath = dappPath;

  constructor(options) {
    this.env = options.env || 'default';
    this.webServerConfig = options.webServerConfig;
    this.embarkConfig = options.embarkConfig;
    this.configDir = options.configDir || DEFAULT_CONFIG_PATH;
    this.chainsFile = options.chainsFile;
    this.plugins = options.plugins;
    this.locale = options.locale || 'en';
    this.logger = options.logger;
    this.package = options.package;
    this.events = options.events;
    this.context = options.context || [constants.contexts.any];
    this.version = options.version;
    this.client = options.client;

    this.registerEvents();
  }

  setConfig(configName, newConfig, cb) {
    this[configName] = newConfig;
    cb();
  }

  registerEvents() {
    this.events.setCommandHandler("config:cors:add", (url) => {
      this.corsParts.push(url);
      this._updateBlockchainCors();
    });

    this.events.setCommandHandler("config:contractsConfig", (cb) => {
      cb(null, this.contractsConfig);
    });

    this.events.setCommandHandler("config:storageConfig", (cb) => {
      cb(null, this.storageConfig);
    });

    this.events.setCommandHandler("config:contractsConfig:set", this.setConfig.bind(this, 'contractsConfig'));
    this.events.setCommandHandler("config:blockchainConfig:set", this.setConfig.bind(this, 'blockchainConfig'));
    this.events.setCommandHandler("config:storageConfig:set", this.setConfig.bind(this, 'storageConfig'));
    this.events.setCommandHandler("config:namesystemConfig:set", this.setConfig.bind(this, 'namesystemConfig'));
    this.events.setCommandHandler("config:communicationConfig:set", this.setConfig.bind(this, 'communicationConfig'));

    this.events.setCommandHandler("config:contractsFiles", (cb) => {
      cb(null, this.contractsFiles);
    });

    // TODO: refactor this so reading the file can be done with a normal resolver or something that takes advantage of the plugin api
    this.events.setCommandHandler("config:contractsFiles:add", (filename, resolver) => {
      resolver = resolver || (callback => { callback(fs.readFileSync(filename).toString()); });
      this.contractsFiles.push(new File({path: filename, originalPath: filename, type: Types.custom, resolver}));
    });

    this.events.setCommandHandler("config:contractsFiles:reset", (cb) => {
      this.contractsFiles.forEach((file) => {
        if (file.path.includes(".embark")) {
          fs.removeSync(file.path);
        }
        this.contractsFiles = this.contractsFiles.filter((contractFile) => contractFile.path !== file.path);
      });
      cb();
    });

    this.events.on('file-remove', (fileType, removedPath) => {
      if (fileType !== 'contract') {
        return;
      }
      const normalizedPath = path.normalize(removedPath);
      this.contractsFiles = this.contractsFiles.filter(file => path.normalize(file.path) !== normalizedPath);
    });
  }

  loadConfigFiles(options) {
    let interceptLogs = options.interceptLogs;
    if (options.interceptLogs === undefined) {
      interceptLogs = true;
    }

    this.embarkConfig.plugins = this.embarkConfig.plugins || {};

    this.plugins = new Plugins({
      plugins: this.embarkConfig.plugins,
      logger: this.logger,
      interceptLogs,
      events: this.events,
      config: this,
      context: this.context,
      env: this.env,
      version: this.version,
      client: this.client
    });

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
  }

  reloadConfig() {
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
    this.loadPluginContractFiles();

    this._updateBlockchainCors();
  }

  loadContractFiles() {
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
  }

  _updateBlockchainCors() {
    const blockchainConfig = this.blockchainConfig;
    const storageConfig = this.storageConfig;
    const webServerConfig = this.webServerConfig;
    let corsParts = cloneDeep(this.corsParts);

    if (blockchainConfig.isDev) {
      corsParts.push('*');
    }

    if (webServerConfig && webServerConfig.host) {
      corsParts.push(buildUrlFromConfig(webServerConfig));
    }
    if (storageConfig && storageConfig.enabled) {
      // if getUrl is specified in the config, that needs to be included in cors
      // instead of the concatenated protocol://host:port
      if (storageConfig.upload.getUrl) {
        // remove /ipfs or /bzz: from getUrl if it's there
        let getUrlParts = storageConfig.upload.getUrl.split('/');
        getUrlParts = getUrlParts.slice(0, 3);
        const host = canonicalHost(getUrlParts[2].split(':')[0]);
        const port = getUrlParts[2].split(':')[1];
        getUrlParts[2] = port ? [host, port].join(':') : host;
        corsParts.push(getUrlParts.join('/'));
      } else {
        corsParts.push(buildUrlFromConfig(storageConfig.upload));
      }
    }
    // Add cors for the proxy and whisper
    corsParts.push(constants.embarkResourceOrigin);

    corsParts = Array.from(new Set(corsParts));
    this.corsParts = corsParts;

    const cors = corsParts.join(',');
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
  }

  _loadConfigFile(configFilePath, defaultConfig, enabledByDefault = false) {
    if (!configFilePath) {
      const configToReturn = defaultConfig.default || {};
      configToReturn.enabled = enabledByDefault;
      return configToReturn;
    }
    configFilePath = configFilePath.replace('.json', '').replace('.js', '');
    let config;
    if (fs.existsSync(configFilePath + '.js')) {
      delete require.cache[configFilePath + '.js'];
      config = require(configFilePath + '.js');
    } else if (fs.existsSync(configFilePath + '.json')) {
      config = fs.readJSONSync(configFilePath + '.json');
    } else {
      this.logger.warn(__("no config file found at %s using default config", configFilePath));
      return defaultConfig.default || {};
    }
    return config;
  }

  _doMergeConfig(config, defaultConfig, env) {
    const configObject = recursiveMerge(defaultConfig, config);

    if (env) {
      if (env === 'test' && !configObject[env]) {
        // Disabled all configs in tests as they are opt in
        return Object.assign({}, defaultConfig.default, { enabled: false });
      }
      return recursiveMerge(configObject.default || {}, configObject[env]);
    } else if (env !== false) {
      this.logger.info(__("No environment called %s found. Using defaults.", env));
    }
    return configObject;
  }

  _loadAndMergeConfig(configFilePath, defaultConfig, env, enabledByDefault = false) {
    const config = this._loadConfigFile(configFilePath, defaultConfig, enabledByDefault);
    return this._doMergeConfig(config, defaultConfig, env);
  }

  _getFileOrObject(object, filePath, property) {
    if (typeof object === 'object') {
      return object[property] ? dappPath(object[property]) : object[property];
    }
    return dappPath(object, filePath);
  }

  /*eslint complexity: ["error", 30]*/
  loadBlockchainConfigFile() {
    const blockchainDefaults = getBlockchainDefaults(this.env);
    const configFilePath = this._getFileOrObject(this.configDir, 'blockchain', 'blockchain');

    const userConfig = this._loadConfigFile(configFilePath, blockchainDefaults, true);
    const envConfig = userConfig[this.env];

    if (envConfig) {
      if (envConfig.ethereumClientName || envConfig.hasOwnProperty('isDev') || envConfig.hasOwnProperty('mineWhenNeeded')) {
        this.logger.error(__('The blockchain config has changed quite a bit in Embark 5\nPlease visit %s to know what has to be changed', embark5ChangesUrl.underline));
        process.exit(1);
      }
      if (envConfig.clientConfig) {
        Object.assign(envConfig, envConfig.clientConfig);
        delete envConfig.clientConfig;
      }
      switch (envConfig.miningMode) {
        case 'dev': envConfig.isDev = true; break;
        case 'auto': envConfig.isDev = false; envConfig.mineWhenNeeded = true; break;
        case 'always': envConfig.isDev = false; envConfig.mineWhenNeeded = false; envConfig.mine = true; break;
        case 'off': envConfig.isDev = false; envConfig.mineWhenNeeded = false; envConfig.mine = false; break;
        default: envConfig.isDev = false;
      }
      if (envConfig.cors) {
        const autoIndex = envConfig.cors.indexOf('auto');
        envConfig.rpcCorsDomain = {};
        envConfig.wsOrigins = {};
        if (autoIndex > -1) {
          envConfig.rpcCorsDomain.auto = true;
          envConfig.wsOrigins.auto = true;
          envConfig.cors.splice(autoIndex, 1);
        } else {
          envConfig.rpcCorsDomain.auto = false;
          envConfig.wsOrigins.auto = false;
        }
        envConfig.rpcCorsDomain.additionalCors = envConfig.cors;
        envConfig.wsOrigins.additionalCors = envConfig.cors;
        delete envConfig.cors;
      }

      userConfig[this.env] = envConfig;
    }

    this.blockchainConfig = this._doMergeConfig(userConfig, blockchainDefaults, this.env);

    if (!configFilePath) {
      this.blockchainConfig.default = true;
    }

    if (this.blockchainConfig.targetGasLimit && this.blockchainConfig.targetGasLimit.toString().match(unitRegex)) {
      this.blockchainConfig.targetGasLimit = getWeiBalanceFromString(this.blockchainConfig.targetGasLimit);
    }

    if (this.blockchainConfig.gasPrice && this.blockchainConfig.gasPrice.toString().match(unitRegex)) {
      this.blockchainConfig.gasPrice = getWeiBalanceFromString(this.blockchainConfig.gasPrice);
    }

    if (this.blockchainConfig.accounts) {
      this.blockchainConfig.accounts.forEach(acc => {
        if (acc.balance && acc.balance.toString().match(unitRegex)) {
          acc.balance = getWeiBalanceFromString(acc.balance);
        }
      });
    }

    if (this.blockchainConfig.endpoint) {
      const {type, host, port} = deconstructUrl(this.blockchainConfig.endpoint);
      if (type === 'ws') {
        this.blockchainConfig.wsHost = host;
        this.blockchainConfig.wsPort = port;
        this.blockchainConfig.wsRPC = true;
      } else {
        this.blockchainConfig.rpcHost = host;
        this.blockchainConfig.rpcPort = port;
        this.blockchainConfig.wsRPC = false;
      }
    } else {
      const urlConfig = (this.blockchainConfig.wsHost) ? {
        host: this.blockchainConfig.wsHost,
        port: this.blockchainConfig.wsPort,
        type: 'ws'
      } : {
        host: this.blockchainConfig.rpcHost,
        port: this.blockchainConfig.rpcPort,
        type: 'rpc'
      };
      this.blockchainConfig.endpoint = buildUrlFromConfig(urlConfig);
      this.blockchainConfig.isAutoEndpoint = true;
    }

    const accountDocsMessage = __('For more info, check the docs: %s', 'https://framework.embarklabs.io/docs/blockchain_accounts_configuration.html'.underline);
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
  }

  loadContractsConfigFile() {
    let configObject = getContractDefaults(this.embarkConfig.versions);

    const contractsConfigs = this.plugins.getPluginsProperty('contractsConfig', 'contractsConfigs');
    contractsConfigs.forEach(pluginConfig => {
      configObject = recursiveMerge(configObject, pluginConfig);
    });

    const configFilePath = this._getFileOrObject(this.configDir, 'contracts', 'contracts');
    let newContractsConfig = this._loadAndMergeConfig(configFilePath, configObject, this.env);
    if (newContractsConfig.contracts) {
      this.logger.error(__('`contracts` has been renamed `deploy` in contracts config\nFor more information: %s', embark5ChangesUrl.underline));
      process.exit(1);
    }
    if (newContractsConfig.deployment) {
      this.logger.error(__('`deployment` has been removed from contracts config and is now part of blockchain config\nFor more information: %s', embark5ChangesUrl.underline));
      process.exit(1);
    }
    if (newContractsConfig.gas.match(unitRegex)) {
      newContractsConfig.gas = getWeiBalanceFromString(newContractsConfig.gas);
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
  }

  loadExternalContractsFiles() {
    const contracts = this.contractsConfig.contracts;
    const storageConfig = this.storageConfig;
    if (storageConfig && storageConfig.upload && storageConfig.upload.getUrl) {
      this.providerUrl = storageConfig.upload.getUrl;
    }
    for (const contract of Object.values(contracts) as any[]) {
      if (!contract.file) {
        continue;
      }

      let externalContractFile;

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
  }

  loadStorageConfigFile() {
    const configObject = {
      default: {
        enabled: true,
        available_providers: ["ipfs", "swarm"],
        ipfs_bin: "ipfs",
        upload: {
          provider: "ipfs",
          protocol: "http",
          host: defaultHost,
          port: 5001,
          getUrl: "http://localhost:8080/ipfs/"
        },
        dappConnection: [{ provider: "ipfs", host: "localhost", port: 5001, getUrl: "http://localhost:8080/ipfs/" }]
      }
    };

    const configFilePath = this._getFileOrObject(this.configDir, 'storage', 'storage');

    this.storageConfig = this._loadAndMergeConfig(configFilePath, configObject, this.env);
    this.events.emit('config:load:storage', this.storageConfig);
  }

  loadNameSystemConfigFile() {
    // todo: spec out names for registration in the file itself for a dev chain
    const configObject = {
      default: {
        enabled: false
      }
    };

    const configFilePath = this._getFileOrObject(this.configDir, 'namesystem', 'namesystem');

    this.namesystemConfig = this._loadAndMergeConfig(configFilePath, configObject, this.env);
  }

  loadCommunicationConfigFile() {
    const configObject = {
      default: {
        enabled: false,
        provider: "whisper",
        available_providers: ["whisper"],
        client: "geth",
        connection: {
          host: defaultHost,
          port: 8547,
          type: "ws"
        }
      }
    };

    const configFilePath = this._getFileOrObject(this.configDir, 'communication', 'communication');

    this.communicationConfig = this._loadAndMergeConfig(configFilePath, configObject, this.env);
    this.events.emit('config:load:communication', this.communicationConfig);
  }

  loadWebServerConfigFile() {
    const configObject = {
      enabled: true,
      host: defaultHost,
      openBrowser: true,
      port: 8000,
      enableCatchAll: true,
      protocol: "http"
    };

    const configFilePath = this._getFileOrObject(this.configDir, 'webserver', 'webserver');

    const webServerConfig = this._loadAndMergeConfig(configFilePath, configObject, false);

    if (webServerConfig.https) {
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
      this.webServerConfig = { enabled: false };
      return;
    }
    if (this.webServerConfig) {
      // cli flags to `embark run` should override configFile and defaults (configObject)
      this.webServerConfig = recursiveMerge(webServerConfig, this.webServerConfig);
    } else {
      this.webServerConfig = webServerConfig;
    }

    if (!this.pipelineConfig.enabled) {
      this.webServerConfig.enabled = false;
    }

    this.events.emit('config:load:webserver', this.webServerConfig);
  }

  loadEmbarkConfigFile() {
    this.embarkConfig = recursiveMerge(constants.defaultEmbarkConfig, this.embarkConfig);

    const contracts = this.embarkConfig.contracts;
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
  }

  loadAssetFiles() {
    if (!this.embarkConfig.app) { return; }
    Object.keys(this.embarkConfig.app).forEach(targetFile => {
      this.assetFiles[targetFile] = this.loadFiles(this.embarkConfig.app[targetFile]);
    });
  }

  loadFiles(files) {
    const self = this;
    const originalFiles = filesMatchingPattern(files);
    const readFiles: File[] = [];
    const storageConfig = self.storageConfig;

    originalFiles.filter(file => {
      return (file[0] === '$' || file.indexOf('.') >= 0);
    }).filter(file => {
      const basedir = findMatchingExpression(file, files);
      readFiles.push(new File({ path: file, originalPath: file, type: Types.dappFile, basedir, storageConfig }));
    });

    type _File = File & { intendedPath?: string, file?: string };
    const filesFromPlugins: _File[] = [];
    const filePlugins = self.plugins.getPluginsFor('pipelineFiles');
    filePlugins.forEach((plugin: Plugin) => {
      try {
        const fileObjects = plugin.runFilePipeline();
        for (const fileObject of fileObjects) {
          filesFromPlugins.push(fileObject);
        }
      } catch (err) {
        self.logger.error(err.message);
      }
    });

    filesFromPlugins.filter(file => {
      if ((file.intendedPath && fileMatchesPattern(files, file.intendedPath)) || fileMatchesPattern(files, file.file)) {
        readFiles.push(file);
      }
    });

    return readFiles;
  }

  // NOTE: this doesn't work for internal modules
  loadPluginContractFiles() {
    const self = this;
    const storageConfig = self.storageConfig;
    const contractsPlugins = this.plugins.getPluginsFor('contractFiles');
    contractsPlugins.forEach((plugin: Plugin) => {
      plugin.contractsFiles.forEach(file => {
        const filename = file.replace('./', '');
        self.contractsFiles.push(new File({
          path: filename, originalPath: path.join(plugin.pluginPath, filename), pluginPath: plugin.pluginPath, type: Types.custom, storageConfig,
          resolver(callback) {
            callback(plugin.loadPluginFile(file));
          }
        }));
      });
    });
  }
}

function findMatchingExpression(filename, filesExpressions) {
  for (const fileExpression of filesExpressions) {
    const matchingFiles = filesMatchingPattern(fileExpression);
    for (const matchFile of matchingFiles) {
      if (matchFile === filename) {
        return path.dirname(fileExpression).replace(/\*/g, '');
      }
    }
  }
  return path.dirname(filename);
}

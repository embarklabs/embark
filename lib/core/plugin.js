const fs = require('./fs.js');
const utils = require('../utils/utils.js');
const constants = require('../constants');

// TODO: pass other params like blockchainConfig, contract files, etc..
var Plugin = function(options) {
  this.name = options.name;
  this.isInternal = options.isInternal;
  this.pluginModule = options.pluginModule;
  this.pluginPath = options.pluginPath;
  this.pluginConfig = options.pluginConfig;
  this.shouldInterceptLogs = options.interceptLogs;
  this.clientWeb3Providers = [];
  this.beforeDeploy = [];
  this.contractsGenerators = [];
  this.pipeline = [];
  this.pipelineFiles = [];
  this.console = [];
  this.contractsConfigs = [];
  this.contractsFiles = [];
  this.compilers = [];
  this.serviceChecks = [];
  this.pluginTypes = [];
  this.uploadCmds = [];
  this.imports = [];
  this.embarkjs_code = [];
  this.embarkjs_init_code = {};
  this.afterContractsDeployActions = [];
  this.onDeployActions = [];
  this.eventActions = {};
  this._loggerObject = options.logger;
  this.logger = this._loggerObject; // Might get changed if we do intercept
  this.events = options.events;
  this.config = options.config;
  this.env = options.env;
  this.loaded = false;
  this.currentContext = options.context;
  this.acceptedContext = options.pluginConfig.context || [constants.contexts.any];

  if (!Array.isArray(this.currentContext)) {
    this.currentContext = [this.currentContext];
  }
  if (!Array.isArray(this.acceptedContext)) {
    this.acceptedContext = [this.acceptedContext];
  }
};

Plugin.prototype._log = function(type) {
  this._loggerObject[type](this.name + ':', ...[].slice.call(arguments, 1));
};

Plugin.prototype.setUpLogger = function () {
  this.logger = {
    log: this._log.bind(this, 'log'),
    warn: this._log.bind(this, 'warn'),
    error: this._log.bind(this, 'error'),
    info: this._log.bind(this, 'info'),
    debug: this._log.bind(this, 'debug'),
    trace: this._log.bind(this, 'trace'),
    dir: this._log.bind(this, 'dir')
  };
};

Plugin.prototype.isContextValid = function() {
  if (this.currentContext.includes(constants.contexts.any) || this.acceptedContext.includes(constants.contexts.any)) {
    return true;
  }
  return this.acceptedContext.some(context => {
    return this.currentContext.includes(context);
  });
};

Plugin.prototype.hasContext = function(context) {
  return this.currentContext.includes(context);
};

Plugin.prototype.loadPlugin = function() {
  if (!this.isContextValid())  {
    this.logger.warn(__('Plugin {{name}} can only be loaded in the context of "{{contextes}}"', {name: this.name, contextes: this.acceptedContext.join(', ')}));
    return false;
  }
  this.loaded = true;
  if (this.shouldInterceptLogs) {
    this.setUpLogger();
  }
  (this.pluginModule.call(this, this));
};

Plugin.prototype.loadInternalPlugin = function() {
  new this.pluginModule(this, this.pluginConfig); /*eslint no-new: "off"*/
};

Plugin.prototype.loadPluginFile = function(filename) {
  return fs.readFileSync(this.pathToFile(filename)).toString();
};

Plugin.prototype.pathToFile = function(filename) {
  if (!this.pluginPath) {
    throw new Error('pluginPath not defined for plugin: ' + this.name);
  }
  return utils.joinPath(this.pluginPath, filename);
};

// TODO: add deploy provider
Plugin.prototype.registerClientWeb3Provider = function(cb) {
  this.clientWeb3Providers.push(cb);
  this.addPluginType('clientWeb3Provider');
};

Plugin.prototype.registerContractsGeneration = function(cb) {
  this.contractsGenerators.push(cb);
  this.addPluginType('contractGeneration');
};

Plugin.prototype.registerPipeline = function(matcthingFiles, cb) {
  // TODO: generate error for more than one pipeline per plugin
  this.pipeline.push({matcthingFiles: matcthingFiles, cb: cb});
  this.addPluginType('pipeline');
};

Plugin.prototype.addFileToPipeline = function(file, intendedPath, options) {
  this.pipelineFiles.push({file: file, intendedPath: intendedPath, options: options});
  this.addPluginType('pipelineFiles');
};

Plugin.prototype.addContractFile = function(file) {
  if (this.isInternal) {
    throw new Error("this API cannot work for internal modules. please use an event command instead: config:contractsFiles:add");
  }
  this.contractsFiles.push(file);
  this.addPluginType('contractFiles');
};

Plugin.prototype.registerConsoleCommand = function(cb) {
  this.console.push(cb);
  this.addPluginType('console');
};

// TODO: this only works for services done on startup
Plugin.prototype.registerServiceCheck = function(checkName, checkFn, time) {
  this.serviceChecks.push({checkName: checkName, checkFn: checkFn, time: time});
  this.addPluginType('serviceChecks');
};

Plugin.prototype.has = function(pluginType) {
  return this.pluginTypes.indexOf(pluginType) >= 0;
};

Plugin.prototype.addPluginType = function(pluginType) {
  this.pluginTypes.push(pluginType);
  this.pluginTypes = Array.from(new Set(this.pluginTypes));
};

Plugin.prototype.generateProvider = function(args) {
  return this.clientWeb3Providers.map(function(cb) {
    return cb.call(this, args);
  }).join("\n");
};

Plugin.prototype.generateContracts = function(args) {
  return this.contractsGenerators.map(function(cb) {
    return cb.call(this, args);
  }).join("\n");
};

Plugin.prototype.registerContractConfiguration = function(config) {
  this.contractsConfigs.push(config);
  this.addPluginType('contractsConfig');
};

Plugin.prototype.registerCompiler = function(extension, cb) {
  this.compilers.push({extension: extension, cb: cb});
  this.addPluginType('compilers');
};

Plugin.prototype.registerUploadCommand = function(cmd, cb) {
  this.uploadCmds.push({cmd: cmd, cb: cb});
  this.addPluginType('uploadCmds');
};

Plugin.prototype.addCodeToEmbarkJS = function(code) {
  this.embarkjs_code.push(code);
  this.addPluginType('embarkjsCode');
};

Plugin.prototype.addProviderInit = function(providerType, code, initCondition) {
  this.embarkjs_init_code[providerType] = this.embarkjs_init_code[providerType] || [];
  this.embarkjs_init_code[providerType].push([code, initCondition]);
  this.addPluginType('initCode');
};

Plugin.prototype.registerImportFile = function(importName, importLocation) {
  this.imports.push([importName, importLocation]);
  this.addPluginType('imports');
};

Plugin.prototype.registerActionForEvent = function(eventName, cb) {
  if (!this.eventActions[eventName]) {
    this.eventActions[eventName] = [];
  }
  this.eventActions[eventName].push(cb);
  this.addPluginType('eventActions');
};

Plugin.prototype.runFilePipeline = function() {
  var self = this;

  return this.pipelineFiles.map(function(file) {
      var obj = {};
      obj.filename = file.file.replace('./','');
      obj.content = self.loadPluginFile(file.file).toString();
      obj.intendedPath = file.intendedPath;
      obj.options = file.options;
      obj.path = self.pathToFile(obj.filename);

      return obj;
  });
};

Plugin.prototype.runPipeline = function(args) {
  // TODO: should iterate the pipelines
  var pipeline = this.pipeline[0];
  var shouldRunPipeline = utils.fileMatchesPattern(pipeline.matcthingFiles, args.targetFile);
  if (shouldRunPipeline) {
    return pipeline.cb.call(this, args);
  } else {
    return args.source;
  }
};

module.exports = Plugin;

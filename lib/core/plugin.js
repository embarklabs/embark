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
  this.logger = options.logger;
  this.events = options.events;
  this.config = options.config;
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
    console.log(this.acceptedContext);
    this.logger.warn(`Plugin ${this.name} can only be loaded in the context of "${this.acceptedContext.join(', ')}"`);
    return false;
  }
  this.loaded = true;
  if (this.shouldInterceptLogs) {
    this.interceptLogs(this.pluginModule);
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

Plugin.prototype.interceptLogs = function(context) {
  var self = this;
  // TODO: this is a bit nasty, figure out a better way
  context.console = context.console || console;

  //context.console.error  = function(txt) {
  //  // TODO: logger should support an array instead of a single argument
  //  //self.logger.error.apply(self.logger, arguments);
  //  self.logger.error(self.name + " > " + txt);
  //};
  context.console.log  = function(txt) {
    self.logger.info(self.name + " > " + txt);
  };
  context.console.warn  = function(txt) {
    self.logger.warn(self.name + " > " + txt);
  };
  context.console.info  = function(txt) {
    self.logger.info(self.name + " > " + txt);
  };
  context.console.debug  = function(txt) {
    // TODO: ue JSON.stringify
    self.logger.debug(self.name + " > " + txt);
  };
  context.console.trace  = function(txt) {
    self.logger.trace(self.name + " > " + txt);
  };
  context.console.dir  = function(txt) {
    self.logger.dir(txt);
  };
};

// TODO: add deploy provider
Plugin.prototype.registerClientWeb3Provider = function(cb) {
  this.clientWeb3Providers.push(cb);
  this.pluginTypes.push('clientWeb3Provider');
};

Plugin.prototype.registerBeforeDeploy = function(cb) {
  this.beforeDeploy.push(cb);
  this.pluginTypes.push('beforeDeploy');
};

Plugin.prototype.registerContractsGeneration = function(cb) {
  this.contractsGenerators.push(cb);
  this.pluginTypes.push('contractGeneration');
};

Plugin.prototype.registerPipeline = function(matcthingFiles, cb) {
  // TODO: generate error for more than one pipeline per plugin
  this.pipeline.push({matcthingFiles: matcthingFiles, cb: cb});
  this.pluginTypes.push('pipeline');
};

Plugin.prototype.addFileToPipeline = function(file, intendedPath, options) {
  this.pipelineFiles.push({file: file, intendedPath: intendedPath, options: options});
  this.pluginTypes.push('pipelineFiles');
};

Plugin.prototype.addContractFile = function(file) {
  this.contractsFiles.push(file);
  this.pluginTypes.push('contractFiles');
};

Plugin.prototype.registerConsoleCommand = function(cb) {
  this.console.push(cb);
  this.pluginTypes.push('console');
};

// TODO: this only works for services done on startup
Plugin.prototype.registerServiceCheck = function(checkName, checkFn, time) {
  this.serviceChecks.push({checkName: checkName, checkFn: checkFn, time: time});
  this.pluginTypes.push('serviceChecks');
};

Plugin.prototype.has = function(pluginType) {
  return this.pluginTypes.indexOf(pluginType) >= 0;
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
  this.pluginTypes.push('contractsConfig');
};

Plugin.prototype.registerCompiler = function(extension, cb) {
  this.compilers.push({extension: extension, cb: cb});
  this.pluginTypes.push('compilers');
};

Plugin.prototype.registerUploadCommand = function(cmd, cb) {
  this.uploadCmds.push({cmd: cmd, cb: cb});
  this.pluginTypes.push('uploadCmds');
};

Plugin.prototype.addCodeToEmbarkJS = function(code) {
  this.embarkjs_code.push(code);
  this.pluginTypes.push('embarkjsCode');
};

Plugin.prototype.addProviderInit = function(providerType, code, initCondition) {
  this.embarkjs_init_code[providerType] = this.embarkjs_init_code[providerType] || [];
  this.embarkjs_init_code[providerType].push([code, initCondition]);
  this.pluginTypes.push('initCode');
};

Plugin.prototype.registerImportFile = function(importName, importLocation) {
  this.imports.push([importName, importLocation]);
  this.pluginTypes.push('imports');
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

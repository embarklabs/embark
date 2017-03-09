/*jshint esversion: 6, loopfunc: true */
var fs = require('./fs.js');
var utils = require('./utils.js');

// TODO: pass other params like blockchainConfig, contract files, etc..
var Plugin = function(options) {
  this.name = options.name;
  this.pluginModule = options.pluginModule;
  this.pluginPath = options.pluginPath;
  this.pluginConfig = options.pluginConfig;
  this.shouldInterceptLogs = options.interceptLogs;
  this.clientWeb3Providers = [];
  this.contractsGenerators = [];
  this.pipeline = [];
  this.pipelineFiles = [];
  this.console = [];
  this.contractsConfigs = [];
  this.contractsFiles = [];
  this.compilers = [];
  this.pluginTypes = [];
  this.logger = options.logger;
  this.events = options.events;
  this.config = options.config;
};

Plugin.prototype.loadPlugin = function() {
  if (this.shouldInterceptLogs) {
    this.interceptLogs(this.pluginModule);
  }
  (this.pluginModule.call(this, this));
};

Plugin.prototype.loadPluginFile = function(filename) {
  return fs.readFileSync(this.pathToFile(filename)).toString();
};

Plugin.prototype.pathToFile = function(filename) {
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
};

// TODO: add deploy provider
Plugin.prototype.registerClientWeb3Provider = function(cb) {
  this.clientWeb3Providers.push(cb);
  this.pluginTypes.push('clientWeb3Provider');
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

Plugin.prototype.runCommands = function(cmd, options) {
  return this.console.map(function(cb) {
    return cb.call(this, cmd, options);
  }).join("\n");
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

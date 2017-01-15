/*jshint esversion: 6, loopfunc: true */
var grunt = require('grunt');

// TODO: pass other params like blockchainConfig, contract files, etc..
var Plugin = function(options) {
  this.name = options.name;
  this.pluginModule = options.pluginModule;
  this.pluginConfig = options.pluginConfig;
  this.clientWeb3Providers = [];
  this.contractsGenerators = [];
  this.pipeline = [];
  this.pluginTypes = [];
  this.logger = options.logger;
};

Plugin.prototype.loadPlugin = function() {
   this.interceptLogs(this.pluginModule);
   (this.pluginModule.call(this, this));
};

Plugin.prototype.interceptLogs = function(context) {
  var self = this;
  context.console = console;
  context.console.error  = function(txt) {
    // TODO: logger should support an array instead of a single argument
    //self.logger.error.apply(self.logger, arguments);
    self.logger.error(self.name + " > " + txt);
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

Plugin.prototype.runPipeline = function(args) {
  // TODO: should iterate the pipeliens
  var pipeline = this.pipeline[0];
  //var shouldRunPipeline = pipeline.matcthingFiles.some(match => {
  //});
  var shouldRunPipeline = grunt.file.isMatch(pipeline.matcthingFiles, args.targetFile);
  if (shouldRunPipeline) {
    return pipeline.cb.call(this, args);
  } else {
    return args.source;
  }
};

module.exports = Plugin;

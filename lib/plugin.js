
// TODO: pass other params like blockchainConfig, contract files, etc..
var Plugin = function(options) {
  this.name = options.name;
  this.pluginModule = options.pluginModule;
  this.clientWeb3Providers = [];
  this.contractsGenerators = [];
  this.pipeline = [];
  this.pluginTypes = [];
};

Plugin.prototype.loadPlugin = function() {
   (this.pluginModule.call(this, this));
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

Plugin.prototype.registerPipeline = function(cb) {
  // TODO: generate error for more than one pipeline per plugin
  this.pipeline.push(cb);
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
  return this.pipeline[0].call(this, args);
};

module.exports = Plugin;

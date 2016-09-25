/*jshint esversion: 6 */
var fs = require('fs');
var chokidar = require('chokidar');

var Watch = function(options) {
  this.logger = options.logger;
  this.events = {};
};

Watch.prototype.start = function() {
   var self = this;
  // TODO: should come from the config object instead of reading the file
  // directly
  var embarkConfig = JSON.parse(fs.readFileSync("embark.json"));

  this.watchAssets(embarkConfig, function() {
    self.logger.info('ready to watch asset changes');
  });

  this.watchContracts(embarkConfig, function() {
    self.logger.info('ready to watch contract changes');
  });

  this.watchConfigs(function() {
    self.logger.info('ready to watch config changes');
  });

  this.logger.info("done!");
};

Watch.prototype.watchAssets = function(embarkConfig, callback) {
  var self = this;
  var appConfig = embarkConfig.app;
  var filesToWatch = [];

  for(var targetFile in appConfig) {
    filesToWatch.push(appConfig[targetFile]);
  }

  this.logger.trace(filesToWatch);

  var assetWatcher = chokidar.watch(filesToWatch, {
    ignored: /[\/\\]\./, persistent: true, ignoreInitial: true, followSymlinks: true
  });

  assetWatcher
  .on('add',    path => {
    self.logger.info(`File ${path} has been added`);
    self.trigger('rebuildAssets', path);
  })
  .on('change', path => {
    self.logger.info(`File ${path} has been changed`);
    self.trigger('rebuildAssets', path);
  })
  .on('unlink', path => {
    self.logger.info(`File ${path} has been removed`);
    self.trigger('rebuildAssets', path);
  })
  .on('ready', () => callback());
};

Watch.prototype.watchContracts = function(embarkConfig, callback) {
  var contractsToWatch = [];
  contractsToWatch.push(embarkConfig.contracts);

  this.logger.trace(contractsToWatch);

  var contractWatcher = chokidar.watch(contractsToWatch, {
    ignored: /[\/\\]\./, persistent: true, ignoreInitial: true, followSymlinks: true
  });

  contractWatcher
  .on('add',    path => {
    self.logger.info(`File ${path} has been added`);
    self.trigger('redeploy', path);
  })
  .on('change', path => {
    self.logger.info(`File ${path} has been changed`);
    self.trigger('redeploy', path);
  })
  .on('unlink', path => this.logger.info(`File ${path} has been removed`))
  .on('ready', () => callback());
};

Watch.prototype.watchConfigs = function(callback) {
  var configWatcher = chokidar.watch("config/**/contracts.json", {
    ignored: /[\/\\]\./, persistent: true, ignoreInitial: true, followSymlinks: true
  });

  configWatcher
  .on('add',    path => {
    self.logger.info(`File ${path} has been added`);
    self.trigger('redeploy', path);
  })
  .on('change', path => {
    self.logger.info(`File ${path} has been changed`);
    self.trigger('redeploy', path);
  })
  .on('unlink', path => {
    self.logger.info(`File ${path} has been removed`);
    self.trigger('redeploy', path);
  })
  .on('ready', () => callback());
};

Watch.prototype.on = function(eventName, callback) {
  this.events[eventName] = callback;
};

Watch.prototype.trigger = function(eventName, values) {
  this.events[eventName](values);
};

module.exports = Watch;

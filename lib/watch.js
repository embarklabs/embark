/*jshint esversion: 6 */
var fs = require('fs');
var chokidar = require('chokidar');

var Watch = function(options) {
  this.logger = options.logger;
  this.events = {};
};

Watch.prototype.start = function() {
  var embarkConfig = JSON.parse(fs.readFileSync("embark.json"));

  var appConfig = embarkConfig.app;
  var filesToWatch = [];

  for(var targetFile in appConfig) {
    filesToWatch.push(appConfig[targetFile]);
  }

  // TODO: add callback to ready
  this.logger.trace(filesToWatch);
  var assetWatcher = chokidar.watch(filesToWatch, {
    ignored: /[\/\\]\./, persistent: true, ignoreInitial: true, followSymlinks: true
  });
  assetWatcher
  .on('add',    path => {
    this.logger.info(`File ${path} has been added`)
    this.trigger('rebuildAssets', path);
  })
  .on('change', path => {
    this.logger.info(`File ${path} has been changed`)
    this.trigger('rebuildAssets', path);
  })
  .on('unlink', path => {
    this.logger.info(`File ${path} has been removed`)
    this.trigger('rebuildAssets', path);
  })
  .on('ready', () => this.logger.info('ready to watch changes'));

  var contractsToWatch = [];
  contractsToWatch.push(embarkConfig.contracts);
  this.logger.trace(contractsToWatch);
  var contractWatcher = chokidar.watch(contractsToWatch, {
    ignored: /[\/\\]\./, persistent: true, ignoreInitial: true, followSymlinks: true
  });
  contractWatcher
  .on('add',    path => {
    this.logger.info(`File ${path} has been added`)
    this.trigger('redeploy', path);
  })
  .on('change', path => {
      this.logger.info(`File ${path} has been changed`);
      this.trigger('redeploy', path);
  })
  .on('unlink', path => this.logger.info(`File ${path} has been removed`))
  .on('ready', () => this.logger.info('ready to watch changes'));

  this.logger.info("done!");
};

Watch.prototype.on = function(eventName, callback) {
  this.events[eventName] = callback;
};

Watch.prototype.trigger = function(eventName, values) {
  this.events[eventName](values);
};

module.exports = Watch;

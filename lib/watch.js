/*jshint esversion: 6 */
var fs = require('fs');
var chokidar = require('chokidar');

var Watch = function(options) {
  this.logger = options.logger;
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
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true,
    followSymlinks: true
  });
  assetWatcher
  .on('add',    path => this.logger.info(`File ${path} has been added`))
  .on('change', path => this.logger.info(`File ${path} has been changed`))
  .on('unlink', path => this.logger.info(`File ${path} has been removed`))
  .on('ready', () => this.logger.info('ready to watch changes'));

  var contractsToWatch = [];
  contractsToWatch.push(embarkConfig.contracts);
  this.logger.trace(contractsToWatch);
  var contractWatcher = chokidar.watch(contractsToWatch, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true,
    followSymlinks: true
  });
  contractWatcher
  .on('add',    path => this.logger.info(`File ${path} has been added`))
  .on('change', path => this.logger.info(`File ${path} has been changed`))
  .on('unlink', path => this.logger.info(`File ${path} has been removed`))
  .on('ready', () => this.logger.info('ready to watch changes'));

  this.logger.info("done!");
};

module.exports = Watch;

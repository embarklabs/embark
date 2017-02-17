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
    self.logger.trace('ready to watch asset changes');
  });

  this.watchContracts(embarkConfig, function() {
    self.logger.trace('ready to watch contract changes');
  });

  this.watchConfigs(function() {
    self.logger.trace('ready to watch config changes');
  });

  this.logger.info("ready to watch file changes");
};

Watch.prototype.watchAssets = function(embarkConfig, callback) {
  var self = this;
  var appConfig = embarkConfig.app;
  var filesToWatch = [];

  for(var targetFile in appConfig) {
    filesToWatch.push(appConfig[targetFile]);
  }

  this.watchFiles(
    filesToWatch,
    function(eventName, path) {
      self.logger.info(`${eventName}: ${path}`);
      self.trigger('rebuildAssets', path);
    },
    function() {
      callback();
    }
  );
};

Watch.prototype.watchContracts = function(embarkConfig, callback) {
  var self = this;
  this.watchFiles(
    [embarkConfig.contracts],
    function(eventName, path) {
      self.logger.info(`${eventName}: ${path}`);
      self.trigger('redeploy', path);
    },
    function() {
      callback();
    }
  );
};

Watch.prototype.watchConfigs = function(callback) {
  var self = this;
  this.watchFiles(
    "config/**/contracts.json",
    function(eventName, path) {
      self.logger.info(`${eventName}: ${path}`);
      self.trigger('redeploy', path);
    },
    function() {
      callback();
    }
  );
};

Watch.prototype.watchFiles = function(files, changeCallback, doneCallback) {
  this.logger.trace('watchFiles');
  this.logger.trace(files);

  var configWatcher = chokidar.watch(files, {
    ignored: /[\/\\]\./, persistent: true, ignoreInitial: true, followSymlinks: true
  });

  configWatcher
  .on('add',    path => changeCallback('add', path))
  .on('change', path => changeCallback('add', path))
  .on('unlink', path => changeCallback('add', path))
  .on('ready', doneCallback);
};

Watch.prototype.on = function(eventName, callback) {
  this.events[eventName] = callback;
};

Watch.prototype.trigger = function(eventName, values) {
  this.events[eventName](values);
};

module.exports = Watch;

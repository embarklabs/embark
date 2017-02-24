/*jshint esversion: 6 */
var chokidar = require('chokidar');

var fs = require('../core/fs.js');

// TODO: this should be receiving the config object not re-reading the
// embark.json file
var Watch = function(options) {
  this.logger = options.logger;
  this.events = options.events;
};

Watch.prototype.start = function() {
   var self = this;
  // TODO: should come from the config object instead of reading the file
  // directly
  var embarkConfig = fs.readJSONSync("embark.json");

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
      self.events.emit('file-' + eventName, 'asset', path);
      self.events.emit('file-event', 'asset', path);
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
      self.events.emit('file-' + eventName, 'contract', path);
      self.events.emit('file-event', 'contract', path);
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
      self.events.emit('file-' + eventName, 'config', path);
      self.events.emit('file-event', 'config', path);
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
  .on('change', path => changeCallback('change', path))
  .on('unlink', path => changeCallback('remove', path))
  .on('ready', doneCallback);
};

module.exports = Watch;

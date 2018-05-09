let chokidar = require('chokidar');
let path = require('path');
const _ = require('underscore');

let fs = require('../core/fs.js');

// TODO: this should be receiving the config object not re-reading the
// embark.json file
class Watch {
  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.fileWatchers = [];
  }

  start() {
    let self = this;
    // TODO: should come from the config object instead of reading the file
    // directly
    let embarkConfig = fs.readJSONSync("embark.json");

    this.watchAssets(embarkConfig, function () {
      self.logger.trace('ready to watch asset changes');
    });

    this.watchContracts(embarkConfig, function () {
      self.logger.trace('ready to watch contract changes');
    });

    this.watchConfigs(function () {
      self.logger.trace('ready to watch config changes');
    });

    this.logger.info("ready to watch file changes");
  }

  restart() {
    this.stop();
    this.start();
  }

  stop() {
    this.fileWatchers.forEach(fileWatcher => {
      fileWatcher.close();
      fileWatcher = null;
    });
    this.fileWatchers = [];
  }

  watchAssets(embarkConfig, callback) {
    let self = this;
    let appConfig = embarkConfig.app;
    let filesToWatch = [];

    for (let targetFile in appConfig) {
      let files = appConfig[targetFile];
      let fileGlob = files;

      // workaround for imports issue
      // so embark reacts to changes made in imported js files
      // chokidar glob patterns only work with front-slashes
      if (!Array.isArray(files)) {
        fileGlob = path.join(path.dirname(files), '**', '*.*').replace(/\\/g, '/');
      } else if (files.length === 1) {
        fileGlob = path.join(path.dirname(files[0]), '**', '*.*').replace(/\\/g, '/');
      }

      filesToWatch.push(fileGlob);
    }
    filesToWatch = _.uniq(filesToWatch);

    this.watchFiles(
      filesToWatch,
      function (eventName, path) {
        self.logger.info(`${eventName}: ${path}`);
        self.events.emit('file-' + eventName, 'asset', path);
        self.events.emit('file-event', 'asset', path);
      },
      function () {
        callback();
      }
    );
  }

  watchContracts(embarkConfig, callback) {
    let self = this;
    this.watchFiles(
      [embarkConfig.contracts],
      function (eventName, path) {
        self.logger.info(`${eventName}: ${path}`);
        self.events.emit('file-' + eventName, 'contract', path);
        self.events.emit('file-event', 'contract', path);
      },
      function () {
        callback();
      }
    );
  }

  watchConfigs(callback) {
    let self = this;
    this.watchFiles(
      "config/**/contracts.json",
      function (eventName, path) {
        self.logger.info(`${eventName}: ${path}`);
        self.events.emit('file-' + eventName, 'config', path);
        self.events.emit('file-event', 'config', path);
      },
      function () {
        callback();
      }
    );
  }

  watchFiles(files, changeCallback, doneCallback) {
    this.logger.trace('watchFiles');
    this.logger.trace(files);

    let configWatcher = chokidar.watch(files, {
      ignored: /[\/\\]\./, persistent: true, ignoreInitial: true, followSymlinks: true
    });
    this.fileWatchers.push(configWatcher);

    configWatcher
      .on('add', path => changeCallback('add', path))
      .on('change', path => changeCallback('change', path))
      .on('unlink', path => changeCallback('remove', path))
      .on('ready', doneCallback);
  }

}

module.exports = Watch;

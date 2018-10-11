let chokidar = require('chokidar');
let path = require('path');

let fs = require('../../core/fs.js');

const DAPP_PIPELINE_CONFIG_FILE = 'pipeline.js';
const DAPP_WEBPACK_CONFIG_FILE = 'webpack.config.js';
const DAPP_BABEL_LOADER_OVERRIDES_CONFIG_FILE = 'babel-loader-overrides.js';

// TODO: this should be receiving the config object not re-reading the
// embark.json file
class Watcher {
  constructor(embark) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.fileWatchers = [];

    this.events.setCommandHandler('watcher:start', () => this.start());
    this.events.setCommandHandler('watcher:stop', () => this.stop());
    this.events.setCommandHandler('watcher:restart', () => this.restart());
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

    this.watchContractConfig(embarkConfig, function () {
      self.logger.trace('ready to watch contract config changes');
    });

    this.watchPipelineConfig(embarkConfig, function () {
      self.logger.trace('ready to watch pipeline config changes');
    });

    this.watchWebserverConfig(embarkConfig, function () {
      self.logger.trace('ready to watch webserver config changes');
    });

    this.logger.info(__("ready to watch file changes"));
  }

  restart() {
    this.stop();
    this.start();
  }

  stop() {
    this.fileWatchers.forEach(fileWatcher => {
      if (fileWatcher.shouldClose) return;
      if (fileWatcher.isReady) fileWatcher.close();
      fileWatcher.shouldClose = true;
    });
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
    filesToWatch = Array.from(new Set(filesToWatch));

    this.watchFiles(
      filesToWatch,
      function (eventName, path) {
        self.logger.info(`${eventName}: ${path}`);
        self.events.emit('file-' + eventName, 'asset', path);
        self.events.emit('file-event', {fileType: 'asset', path});
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
        self.events.emit('file-event', {fileType: 'contract', path});
      },
      function () {
        callback();
      }
    );
  }

  watchWebserverConfig(embarkConfig, callback) {
    let self = this;
    let webserverConfig;
    if (typeof embarkConfig.config === 'object') {
      if (!embarkConfig.config.webserver) {
        return;
      }
      webserverConfig = embarkConfig.config.webserver;
    } else {
      let contractsFolder = embarkConfig.config.replace(/\\/g, '/');
      if (contractsFolder.charAt(contractsFolder.length - 1) !== '/') {
        contractsFolder += '/';
      }
      webserverConfig = [`${contractsFolder}**/webserver.json`, `${contractsFolder}**/webserver.js`];
    }
    this.watchFiles(webserverConfig,
      function (eventName, path) {
        self.logger.info(`${eventName}: ${path}`);
        self.events.emit('webserver:config:change', 'config', path);
      },
      function () {
        callback();
      }
    );
  }

  watchContractConfig(embarkConfig, callback) {
    let self = this;
    let contractConfig;
    if (typeof embarkConfig.config === 'object' || embarkConfig.config.contracts) {
      contractConfig = embarkConfig.config.contracts;
    } else {
      let contractsFolder = embarkConfig.config.replace(/\\/g, '/');
      if (contractsFolder.charAt(contractsFolder.length - 1) !== '/') {
        contractsFolder += '/';
      }
      contractConfig = [`${contractsFolder}**/contracts.json`, `${contractsFolder}**/contracts.js`];
    }
    this.watchFiles(contractConfig,
      function (eventName, path) {
        self.logger.info(`${eventName}: ${path}`);
        self.events.emit('file-' + eventName, 'config', path);
        self.events.emit('file-event', {fileType: 'config', path});
      },
      function () {
        callback();
      }
    );
  }

  watchPipelineConfig(embarkConfig, callback) {
    let filesToWatch = [
      fs.dappPath('', DAPP_WEBPACK_CONFIG_FILE),
      fs.dappPath('', DAPP_BABEL_LOADER_OVERRIDES_CONFIG_FILE)
    ];

    if (typeof embarkConfig.config === 'object' && embarkConfig.config.pipeline) {
      filesToWatch.push(embarkConfig.config.pipeline);
    } else if (typeof embarkConfig.config === 'string') {
      filesToWatch.push(fs.dappPath(embarkConfig.config, DAPP_PIPELINE_CONFIG_FILE));
    }

    this.watchFiles(filesToWatch, (eventName, path) => {
      this.logger.info(`${eventName}: ${path}`);
      this.events.emit('file-' + eventName, 'config', path);
      this.events.emit('file-event', {fileType: 'config', path});
    }, callback);
  }

  watchFiles(files, changeCallback, doneCallback) {
    this.logger.trace('watchFiles');
    this.logger.trace(files);

    let configWatcher = chokidar.watch(files, {
      ignored: /[\/\\]\.|tmp_/, persistent: true, ignoreInitial: true, followSymlinks: true
    });
    this.fileWatchers.push(configWatcher);

    configWatcher
      .on('add', path => changeCallback('add', path))
      .on('change', path => changeCallback('change', path))
      .on('unlink', path => changeCallback('remove', path))
      .once('ready', () => {
        configWatcher.isReady = true;
        if (configWatcher.shouldClose) configWatcher.close();
        doneCallback();
      });
  }

}

module.exports = Watcher;


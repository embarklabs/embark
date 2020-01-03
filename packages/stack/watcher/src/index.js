import { __ } from 'embark-i18n';
import { dappPath, toForwardSlashes, normalizePath } from 'embark-utils';
let chokidar = require('chokidar');
let path = require('path');

const DAPP_PIPELINE_CONFIG_FILE = 'pipeline.js';
const DAPP_WEBPACK_CONFIG_FILE = 'webpack.config.js';
const DAPP_BABEL_LOADER_OVERRIDES_CONFIG_FILE = 'babel-loader-overrides.js';

// TODO: rename file events to comply with naming convention

class Watcher {
  constructor(embark) {
    this.embarkConfig = embark.config.embarkConfig;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.fileWatchers = [];

    this.events.setCommandHandler('watcher:start', (cb) => this.start(cb));
    this.events.setCommandHandler('watcher:stop', () => this.stop());
    this.events.setCommandHandler('watcher:restart', () => this.restart());
  }

  // TODO: it needs to be more agnostic, the files to watch should be registered through the plugin api
  start(cb) {
    this.watchAssets(this.embarkConfig, () => {
      this.logger.trace('ready to watch asset changes');
    });

    this.watchContracts(this.embarkConfig, () => {
      this.logger.trace('ready to watch contract changes');
    });

    this.watchContractConfig(this.embarkConfig, () => {
      this.logger.trace('ready to watch contract config changes');
    });

    this.watchPipelineConfig(this.embarkConfig, () => {
      this.logger.trace('ready to watch pipeline config changes');
    });

    this.watchWebserverConfig(this.embarkConfig, () => {
      this.logger.trace('ready to watch webserver config changes');
    });

    this.logger.info(__("ready to watch file changes"));
    cb();
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
    let appConfig = embarkConfig.app;
    let filesToWatch = [];

    for (let targetFile in appConfig) {
      let files = appConfig[targetFile];
      let fileGlob = files;

      // workaround for imports issue
      // so embark reacts to changes made in imported js files
      // chokidar glob patterns only work with front-slashes
      if (!Array.isArray(files)) {
        fileGlob = toForwardSlashes(path.join(path.dirname(files), '**', '*.*'));
      } else if (files.length === 1) {
        fileGlob = toForwardSlashes(path.join(path.dirname(files[0]), '**', '*.*'));
      }

      filesToWatch.push(fileGlob);
    }
    filesToWatch = Array.from(new Set(filesToWatch));

    this.watchFiles(
      filesToWatch,
      (eventName, path) => {
        this.logger.info(`${eventName}: ${path}`);
        this.events.emit('file-' + eventName, 'asset', path);
        this.events.emit('file-event', {fileType: 'asset', path});
      },
      () => {
        callback();
      }
    );
  }

  watchContracts(embarkConfig, callback) {
    this.watchFiles(
      [embarkConfig.contracts],
      (eventName, path) => {
        this.logger.info(`${eventName}: ${path}`);
        this.events.emit('file-' + eventName, 'contract', path);
        this.events.emit('file-event', {fileType: 'contract', path});
      },
      () => {
        callback();
      }
    );
  }

  watchWebserverConfig(embarkConfig, callback) {
    let webserverConfig;
    if (typeof embarkConfig.config === 'object') {
      if (!embarkConfig.config.webserver) {
        return;
      }
      webserverConfig = embarkConfig.config.webserver;
    } else {
      let contractsFolder = normalizePath(embarkConfig.config, true);
      if (contractsFolder.charAt(contractsFolder.length - 1) !== '/') {
        contractsFolder += '/';
      }
      webserverConfig = [`${contractsFolder}**/webserver.json`, `${contractsFolder}**/webserver.js`];
    }
    this.watchFiles(webserverConfig,
      (eventName, path) => {
        this.logger.info(`${eventName}: ${path}`);
        this.events.emit('webserver:config:change', 'config', path);
      },
      () => {
        callback();
      }
    );
  }

  watchContractConfig(embarkConfig, callback) {
    let contractConfig;
    if (typeof embarkConfig.config === 'object' || embarkConfig.config.contracts) {
      contractConfig = embarkConfig.config.contracts;
    } else {
      let contractsFolder = normalizePath(embarkConfig.config, true);
      if (contractsFolder.charAt(contractsFolder.length - 1) !== '/') {
        contractsFolder += '/';
      }
      contractConfig = [`${contractsFolder}**/contracts.json`, `${contractsFolder}**/contracts.js`];
    }
    this.watchFiles(contractConfig,
      (eventName, path) => {
        this.logger.info(`${eventName}: ${path}`);
        this.events.emit('file-' + eventName, 'config', path);
        this.events.emit('file-event', {fileType: 'config', path});
      },
      () => {
        callback();
      }
    );
  }

  watchPipelineConfig(embarkConfig, callback) {
    let filesToWatch = [
      dappPath('', DAPP_WEBPACK_CONFIG_FILE),
      dappPath('', DAPP_BABEL_LOADER_OVERRIDES_CONFIG_FILE)
    ];

    if (typeof embarkConfig.config === 'object' && embarkConfig.config.pipeline) {
      filesToWatch.push(embarkConfig.config.pipeline);
    } else if (typeof embarkConfig.config === 'string') {
      filesToWatch.push(dappPath(embarkConfig.config, DAPP_PIPELINE_CONFIG_FILE));
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

    // FIXME this should be handled by the nim-compiler plugin somehow
    //  panicoverride.nim is a file added by nimplay when compiling but then removed
    //  If we don't ignore that file, we start an inifite loop of compilation
    const ignored = new RegExp(`[\\/\\\\]\\.|tmp_|panicoverride\.nim|${path.basename(this.embarkConfig.generationDir)}`);

    let configWatcher = chokidar.watch(files, {
      ignored, persistent: true, ignoreInitial: true, followSymlinks: true
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


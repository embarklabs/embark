const chokidar = require("chokidar");
import { dirname, join as joinPath } from "path";

const fs = require("../../core/fs.js");

const DAPP_PIPELINE_CONFIG_FILE = "pipeline.js";
const DAPP_WEBPACK_CONFIG_FILE = "webpack.config.js";
const DAPP_BABEL_LOADER_OVERRIDES_CONFIG_FILE = "babel-loader-overrides.js";

// TODO: this should be receiving the config object not re-reading the
// embark.json file
class Watcher {
  private logger: any;
  private events: any;
  private fileWatchers: any[];

  constructor(embark: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.fileWatchers = [];

    this.events.setCommandHandler("watcher:start", () => this.start());
    this.events.setCommandHandler("watcher:stop", () => this.stop());
    this.events.setCommandHandler("watcher:restart", () => this.restart());
  }

  private start() {
    // TODO: should come from the config object instead of reading the file
    // directly
    const embarkConfig = fs.readJSONSync("embark.json");

    this.watchAssets(embarkConfig, () => {
      this.logger.trace("ready to watch asset changes");
    });

    this.watchContracts(embarkConfig, () => {
      this.logger.trace("ready to watch contract changes");
    });

    this.watchContractConfig(embarkConfig, () => {
      this.logger.trace("ready to watch contract config changes");
    });

    this.watchPipelineConfig(embarkConfig, () => {
      this.logger.trace("ready to watch pipeline config changes");
    });

    this.watchWebserverConfig(embarkConfig, () => {
      this.logger.trace("ready to watch webserver config changes");
    });

    this.logger.info(__("ready to watch file changes"));
  }

  private restart() {
    this.stop();
    this.start();
  }

  private stop() {
    this.fileWatchers.forEach((fileWatcher: any) => {
      if (fileWatcher.shouldClose) {
        return;
      }
      if (fileWatcher.isReady) {
        fileWatcher.close();
      }
      fileWatcher.shouldClose = true;
    });
  }

  private watchAssets(embarkConfig: any, callback: any) {
    const appConfig = embarkConfig.app;
    let filesToWatch = [];

    for (const targetFile of Object.keys(appConfig)) {
      const files = appConfig[targetFile];
      let fileGlob = files;

      // workaround for imports issue
      // so embark reacts to changes made in imported js files
      // chokidar glob patterns only work with front-slashes
      if (!Array.isArray(files)) {
        fileGlob = joinPath(dirname(files), "**", "*.*").replace(/\\/g, "/");
      } else if (files.length === 1) {
        fileGlob = joinPath(dirname(files[0]), "**", "*.*").replace(/\\/g, "/");
      }

      filesToWatch.push(fileGlob);
    }
    filesToWatch = Array.from(new Set(filesToWatch));

    this.watchFiles(
      filesToWatch,
      (eventName: string, path: string) => {
        this.logger.info(`${eventName}: ${path}`);
        this.events.emit("file-" + eventName, "asset", path);
        this.events.emit("file-event", {fileType: "asset", path});
      },
      () => {
        callback();
      },
    );
  }

  private watchContracts(embarkConfig: any, callback: any) {
    this.watchFiles(
      [embarkConfig.contracts],
      (eventName: string, path: string) => {
        this.logger.info(`${eventName}: ${path}`);
        this.events.emit("file-" + eventName, "contract", path);
        this.events.emit("file-event", {fileType: "contract", path});
      },
      () => {
        callback();
      },
    );
  }

  private watchWebserverConfig(embarkConfig: any, callback: any) {
    let webserverConfig;
    if (typeof embarkConfig.config === "object") {
      if (!embarkConfig.config.webserver) {
        return;
      }
      webserverConfig = embarkConfig.config.webserver;
    } else {
      let contractsFolder = embarkConfig.config.replace(/\\/g, "/");
      if (contractsFolder.charAt(contractsFolder.length - 1) !== "/") {
        contractsFolder += "/";
      }
      webserverConfig = [`${contractsFolder}**/webserver.json`, `${contractsFolder}**/webserver.js`];
    }
    this.watchFiles(webserverConfig,
      (eventName: string, path: string) => {
        this.logger.info(`${eventName}: ${path}`);
        this.events.emit("webserver:config:change", "config", path);
      },
      () => {
        callback();
      },
    );
  }

  private watchContractConfig(embarkConfig: any, callback: any) {
    let contractConfig;
    if (typeof embarkConfig.config === "object" || embarkConfig.config.contracts) {
      contractConfig = embarkConfig.config.contracts;
    } else {
      let contractsFolder = embarkConfig.config.replace(/\\/g, "/");
      if (contractsFolder.charAt(contractsFolder.length - 1) !== "/") {
        contractsFolder += "/";
      }
      contractConfig = [`${contractsFolder}**/contracts.json`, `${contractsFolder}**/contracts.js`];
    }
    this.watchFiles(contractConfig,
      (eventName: string, path: string) => {
        this.logger.info(`${eventName}: ${path}`);
        this.events.emit("file-" + eventName, "config", path);
        this.events.emit("file-event", {fileType: "config", path});
      },
      () => {
        callback();
      },
    );
  }

  private watchPipelineConfig(embarkConfig: any, callback: any) {
    const filesToWatch = [
      fs.dappPath("", DAPP_WEBPACK_CONFIG_FILE),
      fs.dappPath("", DAPP_BABEL_LOADER_OVERRIDES_CONFIG_FILE),
    ];

    if (typeof embarkConfig.config === "object" && embarkConfig.config.pipeline) {
      filesToWatch.push(embarkConfig.config.pipeline);
    } else if (typeof embarkConfig.config === "string") {
      filesToWatch.push(fs.dappPath(embarkConfig.config, DAPP_PIPELINE_CONFIG_FILE));
    }

    this.watchFiles(filesToWatch, (eventName: string, path: string) => {
      this.logger.info(`${eventName}: ${path}`);
      this.events.emit("file-" + eventName, "config", path);
      this.events.emit("file-event", {fileType: "config", path});
    }, callback);
  }

  private watchFiles(files: any, changeCallback: any, doneCallback: any) {
    this.logger.trace("watchFiles");
    this.logger.trace(files);

    const configWatcher = chokidar.watch(files, {
      followSymlinks: true, ignoreInitial: true, ignored: /[\/\\]\.|tmp_/, persistent: true,
    });
    this.fileWatchers.push(configWatcher);

    configWatcher
      .on("add", (path: string) => changeCallback("add", path))
      .on("change", (path: string) => changeCallback("change", path))
      .on("unlink", (path: string) => changeCallback("remove", path))
      .once("ready", () => {
        configWatcher.isReady = true;
        if (configWatcher.shouldClose) {
          configWatcher.close();
        }
        doneCallback();
      });
  }

}

module.exports = Watcher;

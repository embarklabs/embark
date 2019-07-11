const async = require('async');
import { __ } from 'embark-i18n';
import { dappPath, joinPath, LongRunningProcessTimer } from 'embark-utils';
import { ProcessLauncher } from 'embark-core';
const constants = require('embark-core/constants');
const WebpackConfigReader = require('./webpackConfigReader');

const PipelineAPI = require('./api.js');

// TODO: pipeline should just generate files, but doesn't necessarily know much about them
// specially their structure (i.e doesn't care if it's embarkjs or contracts or storage etc..)

class Pipeline {
  constructor(embark, options) {
    this.embark = embark;
    this.env = embark.config.env;
    this.buildDir = embark.config.buildDir;
    this.contractsFiles = embark.config.contractsFiles;
    this.assetFiles = embark.config.assetFiles;
    this.embarkConfig = embark.config.embarkConfig;
    this.events = embark.events;
    this.logger = embark.config.logger;
    this.plugins = embark.config.plugins;
    this.fs = embark.fs;
    this.webpackConfigName = options.webpackConfigName;
    this.pipelinePlugins = this.plugins.getPluginsFor('pipeline');
    this.pipelineConfig = embark.config.pipelineConfig;
    this.isFirstBuild = true;
    this.useDashboard = options.useDashboard;

    // track changes to the pipeline config in the filesystem
    this.events.on('config:load:pipeline', (pipelineConfig) => {
      this.pipelineConfig = pipelineConfig;
    });

    this.events.setCommandHandler('pipeline:generateAll', (cb) => {
      this.generateAll(cb);
    });

    this.events.setCommandHandler('pipeline:build', (options, callback) => {
      if (!this.pipelineConfig.enabled) {
        return this.buildContracts([], callback);
      }
      this.build(options, callback);
    });
    this.events.setCommandHandler('pipeline:build:contracts', callback => this.buildContracts([], callback));
    // TODO: action in the constructor, shoudn't be happening..
    // this.fs.removeSync(this.buildDir);

    this.api = new PipelineAPI(embark, options);
    this.api.registerAPIs();

    this.files = {}

    this.events.setCommandHandler('pipeline:register', (params, cb) => {
      this.files[dappPath(...params.path, params.file)] = params;
      if (cb) {
        cb();
      }
    });
  }

  generateAll(cb) {
    console.dir("generating all files");

    async.waterfall([
      (next) => {
        this.plugins.runActionsForEvent("pipeline:generateAll:before", {}, (err) => {
          next(err);
        });
      },
      (next) => {
        // TODO: make this async
        for (let fileParams of Object.values(this.files)) {
          if (fileParams.format === 'json') {
            this.writeJSONFile(fileParams)
          } else {
            this.writeFile(fileParams)
          }
        }
        next();
      },
      (next) => {
        this.plugins.runActionsForEvent("pipeline:generateAll:after", {}, (err) => {
          next(err);
        });
      }
    ], () => {
      cb();
    });
  }

  writeJSONFile(params) {
    const self = this;
    const dir = dappPath(...params.path);
    const filename = dappPath(...params.path, params.file);
    const content = params.content;

    async.waterfall([
      function makeDirectory(next) {
        self.fs.mkdirp(dir, err => next(err));
      },
      function writeContractsJSON(next) {
        self.fs.writeJson(filename, content, { spaces: 2 }, () => { next() });
      }
    ], () => {
    });
  }

  writeFile(params) {
    const self = this;
    const dir = dappPath(...params.path);
    const filename = dappPath(...params.path, params.file);
    const content = params.content;

    async.waterfall([
      function makeDirectory(next) {
        self.fs.mkdirp(dir, err => next(err));
      },
      function writeFile(next) {
        self.fs.writeFile(filename, content, (err) => { next(err, true) });
      }
    ], () => {
    });
  }

  // =================
  // =================
  // =================
  // =================
  // =================

  build({modifiedAssets}, callback) {
    let self = this;
    const importsList = {};
    let placeholderPage;
    const contractsDir = dappPath(self.embarkConfig.generationDir, constants.dappArtifacts.contractsJs);

    if (!self.assetFiles || !Object.keys(self.assetFiles).length) {
      return self.buildContracts([], callback);
    }

    async.waterfall([
      // TODO: doesn't seem to be actually used (it's done on the webserver itself)
      function createPlaceholderPage(next) {
        if (self.isFirstBuild) {
          self.isFirstBuild = false;
          return next();
        }
        self.events.request('placeholder:build', next);
      },
      (next) => self.buildContracts(importsList, next),
      function createImportList(next) {
        importsList["Embark/EmbarkJS"] = dappPath(self.embarkConfig.generationDir, constants.dappArtifacts.embarkjs);
        importsList["Embark/contracts"] = contractsDir;

        self.plugins.getPluginsProperty('imports', 'imports').forEach(importObject => {
          let [importName, importLocation] = importObject;
          importsList[importName] = importLocation;
        });
        next();
      },
      function shouldRunWebpack(next) {
        // assuming we got here because an asset was changed, let's check our webpack config
        // to see if the changed asset requires webpack to run
        if (!(modifiedAssets && modifiedAssets.length)) return next(null, false);
        const configReader = new WebpackConfigReader({webpackConfigName: self.webpackConfigName});
        return configReader.readConfig((err, config) => {
          if (err) return next(err);

          if (typeof config !== 'object' || config === null) {
            return next(__('Pipeline: bad webpack config, the resolved config was null or not an object'));
          }

          const shouldRun = modifiedAssets.some(modifiedAsset => config.module.rules.some(rule => rule.test.test(modifiedAsset)));
          return next(null, !shouldRun);
        });
      },
      function runWebpack(shouldNotRun, next) {
        if (shouldNotRun) return next();
        const assets = Object.keys(self.assetFiles).filter(key => key.match(/\.js$/));
        if (!assets || !assets.length) {
          return next();
        }
        let strAssets = '';
        if (!self.useDashboard) {
          assets.forEach(key => {
            strAssets += ('\n  ' + (joinPath(self.buildDir, key)).bold.dim);
          });
        }
        const timer = new LongRunningProcessTimer(
          self.logger,
          'webpack',
          '0',
          `${'Pipeline:'.cyan} Bundling dapp using '${self.webpackConfigName}' config...${strAssets}`,
          `${'Pipeline:'.cyan} Still bundling dapp using '${self.webpackConfigName}' config... ({{duration}})${strAssets}`,
          `${'Pipeline:'.cyan} Finished bundling dapp in {{duration}}${strAssets}`,
          {
            showSpinner: !self.useDashboard,
            interval: self.useDashboard ? 5000 : 1000,
            longRunningThreshold: 15000
          }
        );
        timer.start();
        let built = false;
        const webpackProcess = new ProcessLauncher({
          embark: self.embark,
          plugins: self.plugins,
          modulePath: joinPath(__dirname, 'webpackProcess.js'),
          logger: self.logger,
          events: self.events,
          exitCallback: code => {
            if (!built) {
              return next(`Webpack build exited with code ${code} before the process finished`);
            }
            if (code) {
              self.logger.error(__('Webpack build process exited with code ', code));
            }
          }
        });
        webpackProcess.send({
          action: constants.pipeline.init,
          options: {
            webpackConfigName: self.webpackConfigName,
            pipelineConfig: self.pipelineConfig,
            fs: self.embark.fs
          }
        });
        webpackProcess.send({action: constants.pipeline.build, assets: self.assetFiles, importsList});

        webpackProcess.once('result', constants.pipeline.built, (msg) => {
          built = true;
          webpackProcess.kill();
          return next(msg.error);
        });
        webpackProcess.once('result', constants.pipeline.webpackDone, () => {
          timer.end();
        });
      },
      function assetFileWrite(next) {
        async.eachOf(
          // assetFileWrite should not process .js files
          Object.keys(self.assetFiles)
            .filter(key => !key.match(/\.js$/))
            .reduce((obj, key) => {
              obj[key] = self.assetFiles[key];
              return obj;
            }, {}),
          function (files, targetFile, cb) {
            const isDir = targetFile.slice(-1) === '/' || targetFile.slice(-1) === '\\' || targetFile.indexOf('.') === -1;
            // if it's not a directory
            if (!isDir) {
              self.logger.info('Pipeline: '.cyan + __("writing file") + " " + (joinPath(self.buildDir, targetFile)).bold.dim);
            }
            async.map(
              files,
              function (file, fileCb) {
                self.logger.trace("reading " + file.path);
                file.content.then((fileContent) => {
                  self.runPlugins(file, fileContent, fileCb);
                }).catch(fileCb);
              },
              function (err, contentFiles) {
                if (err) {
                  self.logger.error('Pipeline: '.cyan + __('errors found while generating') + ' ' + targetFile);
                }
                let dir = targetFile.split('/').slice(0, -1).join('/');
                self.logger.trace(`${'Pipeline:'.cyan} creating dir ` + joinPath(self.buildDir, dir));
                self.fs.mkdirpSync(joinPath(self.buildDir, dir));

                // if it's a directory
                if (isDir) {
                  let targetDir = targetFile;

                  if (targetDir.slice(-1) !== '/') {
                    targetDir = targetDir + '/';
                  }

                  async.each(contentFiles, function (file, eachCb) {
                    let filename = file.path.replace(file.basedir + '/', '');
                    self.logger.info(`${'Pipeline:'.cyan} writing file ` + (joinPath(self.buildDir, targetDir, filename)).bold.dim);

                    self.fs.copy(file.path, joinPath(self.buildDir, targetDir, filename), {overwrite: true}, eachCb);
                  }, cb);
                  return;
                }

                let content = contentFiles.map(file => {
                  if (file === undefined) {
                    return "";
                  }
                  return file.content;
                }).join("\n");

                if (new RegExp(/^index.html?/i).test(targetFile)) {
                  targetFile = targetFile.replace('index', 'index-temp');
                  placeholderPage = targetFile;
                }
                self.fs.writeFile(joinPath(self.buildDir, targetFile), content, cb);
              }
            );
          },
          next
        );
      },
      function removePlaceholderPage(next) {
        let placeholderFile = joinPath(self.buildDir, placeholderPage);
        self.fs.access(joinPath(self.buildDir, placeholderPage), (err) => {
          if (err) return next(); // index-temp doesn't exist, do nothing

          // rename index-temp.htm/l to index.htm/l, effectively replacing our placeholder page
          // with the contents of the built index.html page
          self.fs.move(placeholderFile, placeholderFile.replace('index-temp', 'index'), {overwrite: true}, next);
        });
      }
    ], callback);
  }

  buildContracts(importsList, cb) {
    const self = this;
    async.waterfall([
      function makeDirectory(next) {
        self.fs.mkdirp(dappPath(self.buildDir, 'contracts'), err => next(err));
      },
      function getContracts(next) {
        self.events.request('contracts:list', next);
      },
      function writeContractsJSON(contracts, next) {
        async.each(contracts, (contract, eachCb) => {
          self.fs.writeJson(dappPath(
            self.buildDir,
            'contracts', contract.className + '.json'
          ), contract, {spaces: 2}, eachCb);
        }, () => next(null, contracts));
      },
      function writeContractJS(contracts, next) {
        const contractsDir = dappPath(self.embarkConfig.generationDir, constants.dappArtifacts.contractsJs);
        self.fs.mkdirp(contractsDir, err => {
          if (err) return next(err);

          // Create a file index.js that requires all contract files
          // Used to enable alternate import syntax:
          // e.g. import {Token} from 'Embark/contracts'
          // e.g. import * as Contracts from 'Embark/contracts'
          let importsHelperFile = self.fs.createWriteStream(joinPath(contractsDir, 'index.js'));
          importsHelperFile.write('module.exports = {\n');

          async.eachOf(contracts, (contract, idx, eachCb) => {
            self.events.request('code-generator:contract', contract.className, (err, contractPath) => {
              if (err) {
                return eachCb(err);
              }
              importsList["Embark/contracts/" + contract.className] = dappPath(contractPath);

              // add the contract to the exports list to support alternate import syntax
              importsHelperFile.write(`"${contract.className}": require('./${contract.className}').default,\n`);
              eachCb();
            });
          }, () => {
            importsHelperFile.write('\n};'); // close the module.exports = {}
            importsHelperFile.close(next); // close the write stream
          });
        });
      }
    ], cb);
  }

  runPlugins(file, fileContent, fileCb) {
    const self = this;
    if (self.pipelinePlugins.length <= 0) {
      return fileCb(null, {content: fileContent, path: file.path, basedir: file.basedir, modified: true});
    }
    async.eachSeries(self.pipelinePlugins, (plugin, pluginCB) => {
      if (file.options && file.options.skipPipeline) {
        return pluginCB();
      }

      fileContent = plugin.runPipeline({targetFile: file.path, source: fileContent});
      file.modified = true;
      pluginCB();
    }, err => {
      if (err) {
        self.logger.error(err.message);
      }
      return fileCb(null, {content: fileContent, path: file.path, basedir: file.basedir, modified: true});
    });
  }

}

module.exports = Pipeline;

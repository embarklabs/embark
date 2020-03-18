const async = require('async');
import { __ } from 'embark-i18n';
import { ProcessLauncher } from 'embark-core';
import { dappPath, joinPath, LongRunningProcessTimer } from 'embark-utils';
const constants = require('embark-core/constants');
const WebpackConfigReader = require('./webpackConfigReader');
require('./env');

class BasicPipeline {

  constructor(embark) {
    this.embark = embark;
    this.assetFiles = embark.config.assetFiles;
    this.isFirstBuild = true;
    this.embarkConfig = embark.config.embarkConfig;
    // TODO: why god why
    // this.useDashboard = options.useDashboard;
    this.useDashboard = true;
    this.fs = embark.fs;
    this.env = embark.config.env;
    this.buildDir = embark.config.buildDir;
    this.contractsFiles = embark.config.contractsFiles;
    this.embarkConfig = embark.config.embarkConfig;

    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = embark.pluginsAPI;
    this.pipelinePlugins = this.plugins.getPluginsFor('pipeline');
    this.pipelineConfig = embark.config.pipelineConfig;

    const env = embark.config.env;
    this.webpackConfigName = embark.pluginConfig[env]?.webpackConfigName ?? 'development';

    let plugin = this.plugins.createPlugin('basic-pipeline', {});

    plugin.registerActionForEvent("pipeline:generateAll:after", this.webpackAssets.bind(this));

    // track changes to the pipeline config in the filesystem
    this.events.on('config:load:pipeline', (pipelineConfig) => {
      this.pipelineConfig = pipelineConfig;
    });
  }

  webpackAssets(params, done) {
    let self = this;
    let placeholderPage;
    const importsList = {};

    if (!self.assetFiles || !Object.keys(self.assetFiles).length) {
      return done(); // no assetFiles so nothing to do
    }

    let modifiedAssets = self.assetFiles;

    async.waterfall([
      (next) => {
        importsList["Embark/EmbarkJS"] = dappPath(self.embarkConfig.generationDir, 'embarkjs.js');
        importsList["Embark/contracts"] = this.embarkConfig.generationDir;
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
            fs: self.embark.fs,
            embarkConfig: self.embark.config.embarkConfig
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
              self.logger.info('Pipeline: '.cyan + __("-- writing file") + " " + (joinPath(self.buildDir, targetFile)).bold.dim);
            }
            // async.map(
            async.mapLimit(
              files,
              1,
              function (file, fileCb) {
                self.logger.trace("reading " + file.path);
                file.content.then((fileContent) => {
                  self.runPlugins(file, fileContent, fileCb);
                }).catch(fileCb);
              },
              function (err, contentFiles) {
                try {
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
                    self.logger.info(`${'Pipeline:'.cyan} -- writing file ` + (joinPath(self.buildDir, targetDir, filename)).bold.dim);

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
                } catch(error) {
                  console.dir(error);
                }
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
    ], done);
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

module.exports = BasicPipeline;

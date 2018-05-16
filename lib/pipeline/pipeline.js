const fs = require('../core/fs.js');
const async = require('async');
const child_process = require('child_process');
const utils = require('../utils/utils.js');
const constants = require('../constants');

require("babel-preset-react");
require("babel-preset-es2015");
require("babel-preset-es2016");
require("babel-preset-es2017");

class Pipeline {

  constructor(options) {
    this.buildDir = options.buildDir;
    this.contractsFiles = options.contractsFiles;
    this.assetFiles = options.assetFiles;
    this.events = options.events;
    this.logger = options.logger;
    this.normalizeInput = options.normalizeInput;
    this.plugins = options.plugins;
    this.pipelinePlugins = this.plugins.getPluginsFor('pipeline');
  }

  build(abi, contractsJSON, path, callback) {
    let self = this;
    const importsList = {};

    async.waterfall([
      function buildTheContracts(next) {
        self.buildContracts(next);
      },
      function buildWeb3(next) {
        self.buildWeb3JS(next);
      },
      function createImportList(next) {
        importsList["Embark/EmbarkJS"] = fs.dappPath(".embark", 'embark.js');
        importsList["Embark/web3"] = fs.dappPath(".embark", 'web3_instance.js');

        self.plugins.getPluginsProperty('imports', 'imports').forEach(function (importObject) {
          let [importName, importLocation] = importObject;
          importsList[importName] = importLocation;
        });

        next();
      },
      function writeContracts(next) {
        self.events.request('contracts:list', (contracts) => {
          async.each(contracts, (contract, eachCb) => {
            self.events.request('code-generator:contract', contract.className, (contractCode) => {
              let filePath = fs.dappPath(".embark", contract.className + '.js');
              importsList["Embark/contracts/" + contract.className] = filePath;
              fs.writeFile(filePath, contractCode, eachCb);
            });
          }, next);
        });
      },
      function assetFileWrite(next) {
        async.eachOf(self.assetFiles, function (files, targetFile, cb) {
            async.map(files,
              function (file, fileCb) {
                self.logger.trace("reading " + file.filename);

                // Not a JS file
                if (file.filename.indexOf('.js') < 0) {
                  return file.content(function (fileContent) {
                    self.runPlugins(file, fileContent, fileCb);
                  });
                }

                // JS files
                async.waterfall([
                  function runWebpack(next) {
                    const webpackProcess = child_process.fork(utils.joinPath(__dirname, 'webpackProcess.js'));
                    webpackProcess.send({action: constants.pipeline.init, options: {}});
                    webpackProcess.send({action: constants.pipeline.build, file, importsList});

                    webpackProcess.on('message', function (msg) {
                      if (msg.result === constants.pipeline.built) {
                        webpackProcess.disconnect();
                        return next(msg.error);
                      }

                      if (msg.result === constants.pipeline.log) {
                        if (self.logger[msg.type]) {
                          return self.logger[msg.type](self.normalizeInput(msg.message));
                        }
                        self.logger.debug(self.normalizeInput(msg.message));
                      }
                    });
                  },

                  function readFile(next) {
                    fs.readFile('./.embark/' + file.filename, (err, data) => {
                      if (err) {
                        return next(err);
                      }
                      next(null, data.toString());
                    });
                  },

                  function runPluginsOnContent(fileContent, next) {
                    self.runPlugins(file, fileContent, next);
                  }

                ], function (err, contentFile) {
                  if (err) {
                    self.logger.error(err);
                    return fileCb(err);
                  }

                  fileCb(null, contentFile);
                });
              },
              function (err, contentFiles) {
                if (err) {
                  self.logger.error(__('errors found while generating') + ' ' + targetFile);
                }
                let dir = targetFile.split('/').slice(0, -1).join('/');
                self.logger.trace("creating dir " + self.buildDir + dir);
                fs.mkdirpSync(self.buildDir + dir);

                // if it's a directory
                if (targetFile.slice(-1) === '/' || targetFile.indexOf('.') === -1) {
                  let targetDir = targetFile;

                  if (targetDir.slice(-1) !== '/') {
                    targetDir = targetDir + '/';
                  }

                  async.each(contentFiles, function (file, mapCb) {
                    let filename = file.filename.replace(file.basedir + '/', '');
                    self.logger.info("writing file " + (self.buildDir + targetDir + filename).bold.dim);

                    fs.copy(file.path, self.buildDir + targetDir + filename, {overwrite: true}, mapCb);
                  }, cb);
                  return;
                }

                let content = contentFiles.map(function (file) {
                  if (file === undefined) {
                    return "";
                  }
                  return file.content;
                }).join("\n");

                self.logger.info(__("writing file") + " " + (self.buildDir + targetFile).bold.dim);
                fs.writeFile(self.buildDir + targetFile, content, cb);
              }
            );
          },
          next);
      }
    ], callback);
  }

  runPlugins(file, fileContent, fileCb) {
    const self = this;
    if (self.pipelinePlugins.length <= 0) {
      return fileCb(null, {content: fileContent, filename: file.filename, path: file.path, basedir: file.basedir, modified: true});
    }
    async.eachSeries(self.pipelinePlugins,
      function(plugin, pluginCB) {
        if (file.options && file.options.skipPipeline) {
          return pluginCB();
        }

        fileContent = plugin.runPipeline({targetFile: file.filename, source: fileContent});
        file.modified = true;
        pluginCB();
      },
      function (err) {
        if (err) {
          self.logger.error(err.message);
        }
        return fileCb(null, {content: fileContent, filename: file.filename, path: file.path, basedir: file.basedir, modified: true});
      }
    );
  }

  buildContracts(callback) {
    const self = this;
    fs.mkdirp(fs.dappPath(this.buildDir, 'contracts'), (err) => {
      if (err) {
        return callback(err);
      }
      self.events.request('contracts:list', (contracts) => {
        async.each(contracts, (contract, eachCb) => {
          fs.writeJson(fs.dappPath(this.buildDir, 'contracts', contract.className + ".json"), contract, {spaces: 2}, eachCb);
        }, callback);
      });
    });
  }

  buildWeb3JS(cb) {
    const self = this;
    async.waterfall([
      function getWeb3Code(next) {
        self.events.request('code-generator:web3js', next);
      },
      function makeDirectory(code, next) {
        fs.mkdirp(fs.dappPath(".embark"), (err, _result) => {
          next(err, code);
        });
      },
      function writeFile(code, next) {
        fs.writeFile(fs.dappPath(".embark", 'web3_instance.js'), code, next);
      }
    ], cb);
  }

}

module.exports = Pipeline;

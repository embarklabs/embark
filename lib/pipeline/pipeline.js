const fs = require('../core/fs.js');
const async = require('async');
const ProcessLauncher = require('../processes/processLauncher');
const utils = require('../utils/utils.js');
const constants = require('../constants');

class Pipeline {

  constructor(options) {
    this.env = options.env;
    this.buildDir = options.buildDir;
    this.contractsFiles = options.contractsFiles;
    this.assetFiles = options.assetFiles;
    this.events = options.events;
    this.logger = options.logger;
    this.plugins = options.plugins;
    this.pipelinePlugins = this.plugins.getPluginsFor('pipeline');
  }

  build(abi, contractsJSON, path, callback) {
    let self = this;
    const importsList = {};
    let placeholderPage;

    if (!this.assetFiles || !Object.keys(this.assetFiles).length) {
      return callback();
    }

    async.waterfall([
      function createPlaceholderPage(next){
        self.events.request('embark-building-placeholder', (html) => {
          fs.mkdirpSync(self.buildDir); // create dist/ folder if not already exists
          fs.writeFile(self.buildDir + 'index.html', html, next);
        });
      },
      function buildTheContracts(next) {
        self.buildContracts(next);
      },
      function buildWeb3(next) {
        self.buildWeb3JS(next);
      },
      function createImportList(next) {
        importsList["Embark/EmbarkJS"] = fs.dappPath(".embark", 'embark.js');
        importsList["Embark/web3"] = fs.dappPath(".embark", 'web3_instance.js');
        importsList["Embark/contracts"] = fs.dappPath(".embark/contracts", '');

        self.plugins.getPluginsProperty('imports', 'imports').forEach(function (importObject) {
          let [importName, importLocation] = importObject;
          importsList[importName] = importLocation;
        });

        next();
      },
      function writeContracts(next) {        
        self.events.request('contracts:list', (_err, contracts) => {
          // ensure the .embark/contracts directory exists (create if not exists)
          fs.mkdirp(fs.dappPath(".embark/contracts", ''), (err) => {
            if(err) return next(err);

            // Create a file .embark/contracts/index.js that requires all contract files
            // Used to enable alternate import syntax:
            // e.g. import {Token} from 'Embark/contracts'
            // e.g. import * as Contracts from 'Embark/contracts'
            let importsHelperFile = fs.createWriteStream(fs.dappPath(".embark/contracts", 'index.js'));
            importsHelperFile.write('module.exports = {\n');

            async.eachOf(contracts, (contract, idx, eachCb) => {
              self.events.request('code-generator:contract', contract.className, (contractCode) => {
                let filePath = fs.dappPath(".embark/contracts", contract.className + '.js');
                importsList["Embark/contracts/" + contract.className] = filePath;
                fs.writeFile(filePath, contractCode, eachCb);

                // add the contract to the exports list to support alternate import syntax
                importsHelperFile.write(`"${contract.className}": require('./${contract.className}').default`);
                if(idx < contracts.length - 1) importsHelperFile.write(',\n'); // add a comma if we have more contracts to add
              });
            }, function(){
              importsHelperFile.write('\n}'); // close the module.exports = {} 
              importsHelperFile.close(next); // close the write stream
            });
          });
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
                    let built = false;
                    const webpackProcess = new ProcessLauncher({
                      modulePath: utils.joinPath(__dirname, 'webpackProcess.js'),
                      logger: self.logger,
                      events: self.events,
                      exitCallback: function (code) {
                        if (!built) {
                          return next(`File building of ${file.filename} exited with code ${code} before the process finished`);
                        }
                        if (code) {
                          self.logger(__('File building process exited with code ', code));
                        }
                      }
                    });
                    webpackProcess.send({action: constants.pipeline.init, options: {env: self.env}});
                    webpackProcess.send({action: constants.pipeline.build, file, importsList});

                    webpackProcess.once('result', constants.pipeline.built, (msg) => {
                      built = true;
                      webpackProcess.kill();
                      return next(msg.error);
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
                if(new RegExp(/^index.html?/i).test(targetFile)){
                  targetFile = targetFile.replace('index', 'index-temp');
                  placeholderPage = targetFile;
                }
                fs.writeFile(self.buildDir + targetFile, content, cb);
              }
            );
          },
          next);
      },
      function removePlaceholderPage(next){
        let placeholderFile = self.buildDir + placeholderPage;
        fs.access(self.buildDir + placeholderPage, (err) => {
          if (err) return next(); // index-temp doesn't exist, do nothing

          // rename index-temp.htm/l to index.htm/l, effectively replacing our placeholder page
          // with the contents of the built index.html page
          fs.move(placeholderFile, placeholderFile.replace('index-temp', 'index'), {overwrite: true}, next);
        });
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

  buildContracts(cb) {
    const self = this;

    async.waterfall([
      function makeDirectory(next) {
        fs.mkdirp(fs.dappPath(self.buildDir, 'contracts'), (err, _result) => {
          next(err);
        });
      },
      function getContracts(next) {
        self.events.request('contracts:list', (err, contracts) => {
          next(err, contracts);
        });
      },
      function writeContractsJSON(contracts, next) {
        async.each(contracts, (contract, eachCb) => {
          fs.writeJson(fs.dappPath(self.buildDir, 'contracts', contract.className + ".json"), contract, {spaces: 2}, eachCb);
        }, () => { next(); });
      }
    ], cb);
  }

  buildWeb3JS(cb) {
    const self = this;
    async.waterfall([
      function makeDirectory(next) {
        fs.mkdirp(fs.dappPath(".embark"), (err, _result) => {
          next(err);
        });
      },
      function getWeb3Code(next) {
        self.events.request('code-generator:web3js', next);
      },
      function writeFile(code, next) {
        fs.writeFile(fs.dappPath(".embark", 'web3_instance.js'), code, next);
      }
    ], cb);
  }
}

module.exports = Pipeline;

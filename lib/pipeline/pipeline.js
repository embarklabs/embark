const fs = require('../core/fs.js');
const async = require('async');
const utils = require('../utils/utils.js');
const webpack = require("webpack");
const constants = require('../constants');
const File = require('../core/file');

require("babel-preset-react");
require("babel-preset-es2015");
require("babel-preset-es2016");
require("babel-preset-es2017");

let pipeline;

// Override process.chdir so that we have a partial-implementation PWD for Windows
const realChdir = process.chdir;
process.chdir = (...args) => {
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }
  realChdir(...args);
};

class Pipeline {

  constructor(options) {
    this.buildDir = options.buildDir;
    this.contractsFiles = options.contractsFiles;
    this.assetFiles = options.assetFiles;
    this.pipelinePlugins = options.pipelinePlugins;
    this.pluginImports = options.pluginImports;
    this.web3Location = options.web3Location;
    this.providerCode = options.providerCode;

    this.interceptLogs();
  }

  interceptLogs() {
    const context = {};
    context.console = console;

    context.console.log = this.log;
    context.console.warn = this.log;
    context.console.info = this.log;
    context.console.debug = this.log;
    context.console.trace = this.log;
    context.console.dir = this.log;
  }

  log() {
    process.send({result: constants.pipeline.log, message: arguments});
  }

  build(abi, contractsJSON, path, callback) {
    let self = this;
    const importsList = {};

    async.waterfall([
      function buildTheContracts(next) {
        self.buildContracts(contractsJSON, next);
      },
      function buildWeb3(next) {
        self.buildWeb3JS(next);
      },
      function createImportList(next) {
        importsList["Embark/EmbarkJS"] = fs.dappPath(".embark", 'embark.js');
        importsList["Embark/web3"] = fs.dappPath(".embark", 'web3_instance.js');

        self.pluginImports.forEach(function (importObject) {
          let [importName, importLocation] = importObject;
          importsList[importName] = importLocation;
        });

        next();
      },
      function writeContracts(next) {
        async.each(Object.keys(contractsJSON), (contractName, eachCb) => {
          self.buildContractJS(contractName, (err, contractCode) => {
            let filePath = fs.dappPath(".embark", contractName + '.js');
            importsList["Embark/contracts/" + contractName] = filePath;
            fs.writeFile(filePath, contractCode, eachCb);
          });
        }, next);
      },
      function assetFileWrite(next) {
        // limit:1 due to issues when downloading required files such as web3.js
        async.eachOfLimit(self.assetFiles, 1, function (files, targetFile, cb) {
            // limit:1 due to issues when downloading required files such as web3.js
            async.mapLimit(files, 1,
              function (file, fileCb) {
                file = new File(file); // Re-instantiate a File as through the process, we lose its prototype
                self.log("reading " + file.filename);

                if (file.filename.indexOf('.js') < 0) {
                  return file.content(function (fileContent) {
                    self.runPlugins(file, fileContent, fileCb);
                  });
                }

                // JS files
                let realCwd;

                async.waterfall([

                  function findImports(next) {
                    self.webpackRun(file.filename, {}, false, importsList, false, next);
                  },

                  function changeCwd(next) {
                    realCwd = utils.pwd();
                    process.chdir(fs.embarkPath(''));
                    next();
                  },

                  function runWebpack(next) {
                    self.webpackRun(file.filename, {}, true, importsList, true, next);
                  },

                  function changeCwdBack(next) {
                    process.chdir(realCwd);
                    next();
                  },

                  function checkFile(next) {
                    fs.access('./.embark/' + file.filename, (err) => {
                      if (err) {
                        self.log("couldn't find file: " + file.filename);
                        return next("couldn't find file: " + file.filename);
                      }
                      next();
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
                    process.chdir(realCwd);
                    self.log(err);
                    return fileCb(err);
                  }

                  fileCb(null, contentFile);
                });
              },
              function (err, contentFiles) {
                if (err) {
                  self.log('errors found while generating ' + targetFile);
                }
                let dir = targetFile.split('/').slice(0, -1).join('/');
                self.log("creating dir " + self.buildDir + dir);
                fs.mkdirpSync(self.buildDir + dir);

                // if it's a directory
                if (targetFile.slice(-1) === '/' || targetFile.indexOf('.') === -1) {
                  let targetDir = targetFile;

                  if (targetDir.slice(-1) !== '/') {
                    targetDir = targetDir + '/';
                  }

                  async.each(contentFiles, function (file, mapCb) {
                    let filename = file.filename.replace(file.basedir + '/', '');
                    self.log("writing file " + (self.buildDir + targetDir + filename).bold.dim);

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

                self.log("writing file " + (self.buildDir + targetFile).bold.dim);
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
      return fileCb(null, {
        content: fileContent,
        filename: file.filename,
        path: file.path,
        basedir: file.basedir,
        modified: true
      });
    }
    async.eachSeries(self.pipelinePlugins,
      function (plugin, pluginCB) {
        if (file.options && file.options.skipPipeline) {
          return pluginCB();
        }

        fileContent = plugin.runPipeline({targetFile: file.filename, source: fileContent});
        file.modified = true;
        pluginCB();
      },
      function (err) {
        if (err) {
          self.log(err.message);
        }
        return fileCb(null, {
          content: fileContent,
          filename: file.filename,
          path: file.path,
          basedir: file.basedir,
          modified: true
        });
      }
    );
  }

  webpackRun(filename, options, includeModules, importsList, detectErrors, callback) {
    let defaultOptions = {
      entry: fs.dappPath(filename),
      output: {
        libraryTarget: 'umd',
        path: fs.dappPath('.embark'),
        filename: filename
      },
      resolve: {
        alias: importsList,
        modules: [
          fs.embarkPath('node_modules'),
          fs.dappPath('node_modules')
        ]
      },
      externals: function (context, request, callback) {
        callback();
      }
    };

    let webpackOptions = utils.recursiveMerge(defaultOptions, options);

    if (includeModules) {
      webpackOptions.module = {
        rules: [
          {
            test: /\.css$/,
            use: [{loader: "style-loader"}, {loader: "css-loader"}]
          },
          {
            test: /\.scss$/,
            use: [{loader: "style-loader"}, {loader: "css-loader"}]
          },
          {
            test: /\.(png|woff|woff2|eot|ttf|svg)$/,
            loader: 'url-loader?limit=100000'
          },
          {
            test: /\.js$/,
            loader: "babel-loader",
            exclude: /(node_modules|bower_components)/,
            options: {
              presets: ['babel-preset-es2016', 'babel-preset-es2017', 'babel-preset-react'].map(require.resolve),
              plugins: ["babel-plugin-webpack-aliases"].map(require.resolve),
              compact: false
            }
          }
        ]
      };
    }

    webpack(webpackOptions).run((_err, _stats) => {
      if (_err) {
        console.log(_err);
      }
      if (!detectErrors) {
        return callback();
      }

      if (_stats.hasErrors()) {
        return callback(_stats.toJson().errors.join("\n"));
      }
      callback();
    });
  }

  buildContracts(contractsJSON, callback) {
    fs.mkdirp(fs.dappPath(this.buildDir, 'contracts'), (err) => {
      if (err) {
        return callback(err);
      }
      async.each(Object.keys(contractsJSON), (className, eachCb) => {
        let contract = contractsJSON[className];
        fs.writeJson(fs.dappPath(this.buildDir, 'contracts', className + ".json"), contract, {spaces: 2}, eachCb);
      }, callback);
    });
  }

  buildContractJS(contractName, callback) {
    fs.readFile(fs.dappPath(this.buildDir, 'contracts', contractName + '.json'), (err, contractJSON) => {
      if (err) {
        return callback(err);
      }
      contractJSON = contractJSON.toString();

      let contractCode = "";
      contractCode += "import web3 from 'Embark/web3';\n";
      contractCode += "import EmbarkJS from 'Embark/EmbarkJS';\n";
      contractCode += "let " + contractName + "JSONConfig = " + contractJSON + ";\n";
      contractCode += "let " + contractName + " = new EmbarkJS.Contract(" + contractName + "JSONConfig);\n";

      contractCode += "\n__embarkContext.execWhenReady(function() {\n";
      contractCode += "\n" + contractName + ".setProvider(web3.currentProvider);\n";
      contractCode += "\n});\n";

      contractCode += "export default " + contractName + ";\n";
      callback(null, contractCode);
    });
  }

  buildWeb3JS(cb) {
    const self = this;
    let code = "";

    async.waterfall([
      function getImports(next) {
        self.web3Location = self.web3Location.replace(/\\/g, '/'); // Import paths must always have forward slashes
        code += "\nimport Web3 from '" + self.web3Location + "';\n";

        code += "\n if (typeof web3 !== 'undefined') {";
        code += "\n } else {";
        code += "\n var web3 = new Web3();\n";
        code += "\n }";

        code += self.providerCode;
        code += "\nglobal.__embarkContext = __mainContext.__loadManagerInstance;\n";
        code += "\nwindow.web3 = web3;\n";
        code += "\nexport default web3;\n";

        next();
      },
      function makeDirectory(next) {
        fs.mkdirp(fs.dappPath(".embark"), (err, _result) => {
          next(err);
        });
      },
      function writeFile(next) {
        fs.writeFile(fs.dappPath(".embark", 'web3_instance.js'), code, next);
      }
    ], cb);
  }
}

process.on('message', (msg) => {
  if (msg.action === constants.pipeline.init) {
    pipeline = new Pipeline(msg.options);
    return process.send({result: constants.pipeline.initiated});
  }

  if (msg.action === constants.pipeline.build) {
    return pipeline.build(msg.abi, msg.contractsJSON, msg.path, (err) => {
      process.send({result: constants.pipeline.built, error: err});
    });
  }
});

process.on('exit', () => {
  process.exit(0);
});

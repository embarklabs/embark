/*jshint esversion: 6, loopfunc: true */
let fs = require('../core/fs.js');
let async = require('async');
//var Plugins = require('../core/plugins.js');
var utils = require('../utils/utils.js');
//var Npm = require('../pipeline/npm.js');
//let currentWeb3Version = require('../../package.json').dependencies.web3.replace("^","");
const webpack = require("webpack");

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
    this.plugins = options.plugins;
  }

  build(abi, contractsJSON, path, callback) {
    let self = this;

    this.buildContracts(contractsJSON);

    self.buildWeb3JS(function() {

    // limit:1 due to issues when downloading required files such as web3.js
    async.eachOfLimit(self.assetFiles, 1, function (files, targetFile, cb) {
      // limit:1 due to issues when downloading required files such as web3.js
      async.mapLimit(files, 1,
        function(file, fileCb) {
          self.logger.trace("reading " + file.filename);

          if (file.filename.indexOf('.js') >= 0) {
              let importsList = {};

              //importsList["Embark/EmbarkJS"] = fs.embarkPath("js/embark.js");

              importsList["Embark/EmbarkJS"] = utils.joinPath(fs.dappPath(), ".embark", 'embark.js');
              importsList["Embark/web3"] = utils.joinPath(fs.dappPath(), ".embark", 'web3_instance.js');

              self.plugins.getPluginsProperty('imports', 'imports').forEach(function (importObject) {
                let [importName, importLocation] = importObject;
                importsList[importName] = importLocation;
              });

              let realCwd;

              async.waterfall([

                function findImports(next) {
                  webpack({
                    entry: utils.joinPath(fs.dappPath(), file.filename),
                    output: {
                      libraryTarget: 'umd',
                      path: utils.joinPath(fs.dappPath(), '.embark'),
                      filename: file.filename
                    },
                    resolve: {
                      alias: importsList,
                      modules: [
                        fs.embarkPath('node_modules'),
                        utils.joinPath(fs.dappPath(), 'node_modules')
                      ]
                    },
                    externals: function(context, request, callback) {
                      callback();
                    }
                  }).run((_err, _stats) => {
                    next();
                  });
                },

                function changeCwd(next) {
                  realCwd = process.env.PWD;
                  process.chdir(fs.embarkPath(''));
                  next();
                },

                function findImportsPhase2(next) {
                  webpack({
                    entry: utils.joinPath(fs.dappPath(), file.filename),
                    output: {
                      libraryTarget: 'umd',
                      path: utils.joinPath(fs.dappPath(), '.embark'),
                      filename: file.filename
                    },
                    resolve: {
                      alias: importsList,
                      modules: [
                        fs.embarkPath('node_modules'),
                        utils.joinPath(fs.dappPath(), 'node_modules')
                      ]
                    },
                    externals: function(context, request, callback) {
                      if (request === utils.joinPath(fs.dappPath(), file.filename)) {
                        callback();
                      } else {
                        if (request.indexOf('Embark/contracts/') === 0) {
                          let contractName = request.split('/')[2];
                          let contractCode = self.buildContractJS(contractName);
                          let filePath = utils.joinPath(fs.dappPath(), ".embark", contractName + '.js');
                          fs.writeFileSync(filePath, contractCode);
                          importsList[request] = filePath;
                        }
                        callback(null, "amd " + Math.random());
                      }
                    },
                    module: {
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
                            presets: ['es2016', 'es2017', 'react'],
                            plugins: ["babel-plugin-webpack-aliases"]
                          }
                        }
                      ]
                    }
                  }).run((_err, _stats) => {
                    console.dir('--------------------------');
                    console.dir(_stats);
                    console.dir('--------------------------');
                    next();
                  });

                },

                function runWebpack(next) {
                  webpack({
                    entry: utils.joinPath(fs.dappPath(), file.filename),
                    output: {
                      libraryTarget: 'umd',
                      path: utils.joinPath(fs.dappPath(), '.embark'),
                      filename: file.filename
                    },
                    resolve: {
                      alias: importsList,
                      modules: [
                        fs.embarkPath('node_modules'),
                        utils.joinPath(fs.dappPath(), 'node_modules')
                      ]
                    },
                    externals: function(context, request, callback) {
                      if (request === "Embark/contracts/all") {
                        return callback(null, fs.readFileSync(utils.joinPath(fs.dappPath(), '.embark', 'embark.js')));
                        // should be .toString() ?
                      }
                      callback();
                    },
                    module: {
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
                            presets: ['es2016', 'es2017', 'react'],
                            plugins: ["babel-plugin-webpack-aliases"]
                          }
                        }
                      ]
                    }
                  }).run((_err, _stats) => {
                    console.dir(_err);
                    next();
                  });

                },

                function changeCwdBack(next) {
                  process.chdir(realCwd);
                  next();
                }

              ], function(_err, _result) {
                if (!fs.existsSync('./.embark/' + file.filename)) {
                  self.logger.error("coudln't find file: " + file.filename);
                  return fileCb("couldn't find file: " + file.filename);
                }
                let fileContent = fs.readFileSync('./.embark/' + file.filename).toString();
                fileCb(null, {content: fileContent, filename: file.filename, path: file.path, modified: true});
              });

          } else {
            file.content(function(fileContent) {
              return fileCb(null, {content: fileContent, filename: file.filename, path: file.path, modified: true});
            });
          }

        },
        function (err, contentFiles) {
          if (err) {
            self.logger.warn('errors found while generating ' + targetFile);
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

            contentFiles.map(function (file) {
              let filename = file.filename.replace('app/', '');
              filename = filename.replace(targetDir, '');
              self.logger.info("writing file " + (self.buildDir + targetDir + filename).bold.dim);

              fs.copySync(self.buildDir + targetDir + filename, file.path, {overwrite: true});
            });
          } else {
            let content = contentFiles.map(function (file) {
              if (file === undefined) {
                return "";
              }
              return file.content;
            }).join("\n");

            self.logger.info("writing file " + (self.buildDir + targetFile).bold.dim);
            fs.writeFileSync(self.buildDir + targetFile, content);
          }
          cb();
        }
      );
    },
    function (_err, _results) {
      callback();
    });
  });
  }

  buildContracts(contractsJSON) {
    fs.mkdirpSync(utils.joinPath(fs.dappPath(), this.buildDir, 'contracts'));

    for (let className in contractsJSON) {
      let contract = contractsJSON[className];
      fs.writeJSONSync(utils.joinPath(fs.dappPath(), this.buildDir, 'contracts', className + ".json"), contract, {spaces: 2});
    }
  }

  buildContractJS(contractName) {
    let contractJSON = fs.readFileSync(utils.joinPath(fs.dappPath(), this.buildDir, 'contracts', contractName + '.json')).toString();

    let contractCode = "";
    contractCode += "import web3 from 'Embark/web3';\n";
    contractCode += "import EmbarkJS from 'Embark/EmbarkJS';\n";
    contractCode += "let " + contractName + "JSONConfig = " + contractJSON + ";\n";
    contractCode += "let " + contractName + " = new EmbarkJS.Contract(" + contractName + "JSONConfig);\n";

    contractCode += "\n__embarkContext.execWhenReady(function() {\n";
    contractCode += "\n" + contractName + ".setProvider(web3.currentProvider);\n";
    contractCode += "\n});\n";

    contractCode += "export default " + contractName + ";\n";

    return contractCode;
  }

  buildWeb3JS(cb) {
    const self = this;
    let code = "";

    async.waterfall([
      function getWeb3Location(next) {
        self.events.request("version:get:web3", function(web3Version) {
          if (web3Version === "1.0.0-beta") {
            return next(null, utils.joinPath(fs.embarkPath("js/web3-1.0.min.js")));
          } else {
            self.events.request("version:getPackageLocation", "web3", web3Version, function(err, location) {
              return next(null, utils.joinPath(process.env.PWD, location));
            });
          }
        });
      },
      function getImports(web3Location, next) {
        code += "\nimport Web3 from '" + web3Location + "';\n";

        code += "\n if (typeof web3 !== 'undefined') {";
        code += "\n } else {";
        code += "\n var web3 = new Web3();\n";
        code += "\n }";

        self.events.request('provider-code', function(providerCode)  {
          code += providerCode;
          code += "\nglobal.__embarkContext = __mainContext.__loadManagerInstance;\n";
          code += "\nwindow.web3 = web3;\n";
          code += "\nexport default web3;\n";
          next();
        });
      },
      function writeFile(next) {
        let filePath = utils.joinPath(fs.dappPath(), ".embark", 'web3_instance.js');
        fs.mkdirpSync(utils.joinPath(fs.dappPath(), ".embark"));
        fs.writeFileSync(filePath, code);
        next();
      }
    ], function(_err, _result) {
      cb();
    });
  }

}

module.exports = Pipeline;

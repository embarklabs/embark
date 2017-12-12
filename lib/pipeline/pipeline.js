/*jshint esversion: 6, loopfunc: true */
let fs = require('../core/fs.js');
let async = require('async');
var Plugins = require('../core/plugins.js');
var utils = require('../utils/utils.js');
var Npm = require('../pipeline/npm.js');
let currentWeb3Version = require('../../package.json').dependencies.web3.replace("^","");
const webpack = require("webpack");

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

    // limit:1 due to issues when downloading required files such as web3.js
    async.eachOfLimit(this.assetFiles, 1, function (files, targetFile, cb) {
      // limit:1 due to issues when downloading required files such as web3.js
      async.mapLimit(files, 1,
        function(file, fileCb) {
          self.logger.trace("reading " + file.filename);

          if (file.filename.indexOf('.js') >= 0) {

              console.log("---");
              console.log(fs.dappPath());
              console.log(file.filename);
              console.log("---");

              let importsList = {};
              async.waterfall([
                function findImports(next) {
                  webpack({
                    entry: utils.joinPath(fs.dappPath(), file.filename),
                    output: {
                      libraryTarget: 'umd',
                      path: utils.joinPath(fs.dappPath(), '.embark'),
                      filename: file.filename
                    },
                    externals: function(context, request, callback) {
                      if (request === utils.joinPath(fs.dappPath(), file.filename)) {
                        callback();
                      } else {
                        console.log("request " + request);
                        if (request === "Embark/EmbarkJS") {
                          importsList["Embark/EmbarkJS"] = fs.embarkPath("js/embark.js");
                        } else if (request === "Embark/test") {
                          importsList["Embark/test"] = fs.embarkPath("js/test.js");
                        } else if (request.indexOf('Embark/contracts/') === 0) {
                          let contractName = request.split('/')[2];
                          let contractCode = self.buildContractJS(contractName);
                          let filePath = utils.joinPath(fs.dappPath(), ".embark", contractName + '.js');
                          fs.writeFileSync(filePath, contractCode);
                          importsList[request] = filePath;
                        } else if (request === "Embark/web3") {
                          console.log("--> web3");
                          return self.events.request('provider-code', function(providerCode)  {
                            let code = "";
                            code += "\nimport Web3 from '" + utils.joinPath(fs.embarkPath("js/web3-1.0.min.js")) + "'\n";
                            //code += "\nvar __mainContext = __mainContext || this;\n";

                            code += "\n if (typeof web3 !== 'undefined') {";
                            //code += "\n__mainContext.web3 = web3;\n";
                            code += "\n } else {";
                            code += "\n var web3 = new Web3();\n";
                            code += "\n }";

                            code += providerCode;
                            code += "\nglobal.__embarkContext = __mainContext.__loadManagerInstance;\n";
                            code += "\nconsole.log('web3');\n";
                            code += "\nconsole.log(web3);\n";
                            //code += "\nwindow.web3 = __mainContext.web3;\n";
                            code += "\nwindow.web3 = web3;\n";
                            code += "\nexport default web3;\n";
                            let filePath = utils.joinPath(fs.dappPath(), ".embark", 'web3_instance.js');
                            fs.writeFileSync(filePath, code);
                            importsList[request] = filePath;
                            callback(null, "amd " + Math.random());
                          });
                        }
                        callback(null, "amd " + Math.random());
                      }
                    },
                    module: {
                      rules: [
                        {
                          test: /\.css$/,
                          use: [
                            { loader: "style-loader" },
                            { loader: "css-loader" }
                          ]
                        }
                      ]
                    }
                  }).run((err, stats) => {
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
                      alias: importsList
                    },
                    externals: function(context, request, callback) {
                        if (request === "Embark/contracts/all") {
                          return callback(null, fs.readFileSync(utils.joinPath(fs.dappPath(), '.embark', 'embark.js')));
                        }
                        callback();
                    },
                    module: {
                      rules: [
                        {
                          test: /\.css$/,
                          use: [
                            { loader: "style-loader" },
                            { loader: "css-loader" }
                          ]
                        }
                      ]
                    }
                  }).run((err, stats) => {
                    next();
                  });

                }

              ], function(err, _result) {
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
  }

  build2(abi, contractsJSON, path, callback) {
    let self = this;

    this.buildContracts(contractsJSON);

    // limit:1 due to issues when downloading required files such as web3.js
    async.eachOfLimit(this.assetFiles, 1, function (files, targetFile, cb) {
      // limit:1 due to issues when downloading required files such as web3.js
      async.mapLimit(files, 1,
        function(file, fileCb) {
          self.logger.trace("reading " + file.filename);

          let pipelinePlugins = self.plugins.getPluginsFor('pipeline');

          if (file.filename === "$ALL_CONTRACTS") {
            return fileCb(null, {content: abi, filename: file.filename, path: file.path, modified: true});
          } else if (file.filename === "$EMBARK_JS") {
            return file.content(function(fileContent) {
              return fileCb(null, {content: fileContent, filename: "embark.js", path: file.path, modified: true});
            });
          } else if (file.filename[0] === '$') {
            let contractName = file.filename.substr(1);
            return fileCb(null, {content: self.buildContractJS(contractName), filename: contractName + ".js", path: file.path, modified: true});
          } else if (file.filename === 'embark.js') {

          //if (file === 'embark.js') {
//
          //  if (self.blockchainConfig.enabled || self.communicationConfig.provider === 'whisper' || self.communicationConfig.available_providers.indexOf('whisper') >= 0) {
          //    let web3Version = self.contractsConfig.versions["web3.js"];
          //    if (web3Version && web3Version != currentWeb3Version) {
          //    //if (false) {
          //      //readFiles.push(new File({filename: 'web3-' + web3Version + '.js', type: 'custom', resolver: function(callback) {
          //      readFiles.push(new File({filename: 'web3.js', type: 'custom', resolver: function(callback) {
          //        if (web3Version === "1.0.0-beta") {
          //          return callback(fs.readFileSync(fs.embarkPath('js/web3-1.0.min.js')).toString());
          //        } else {
          //          let npm = new Npm({logger: self.logger});
          //          npm.getPackageVersion('web3', web3Version, 'dist/web3.min.js', true, function(web3Content) {
          //            callback(web3Content);
          //          });
          //        }
          //      }}));
          //    } else {
          //      readFiles.push(new File({filename: 'web3.js', type: 'embark_internal', path: "js/web3.js"}));
          //    }
          //  }
//
          //  if (self.storageConfig.enabled && (self.storageConfig.provider === 'ipfs' || self.storageConfig.available_providers.indexOf('ipfs') >= 0)) {
          //      //until issues with the correct ipfs version to use are fixed
          //      //readFiles.push(new File({filename: 'ipfs.js', type: 'embark_internal', path: "node_modules/ipfs-api/dist/index.min.js"}));
          //      readFiles.push(new File({filename: 'ipfs.js', type: 'embark_internal', path: "js/ipfs.js"}));
          //  }
//
          //  if (self.communicationConfig.enabled && (self.communicationConfig.provider === 'orbit' || self.communicationConfig.available_providers.indexOf('orbit') >= 0)) {
          //      readFiles.push(new File({filename: 'orbit.js',  type: 'embark_internal', path: "node_modules/orbit-db/dist/orbitdb.min.js"}));
          //  }
//
          //    readFiles.push(new File({filename: 'embark.js', type: 'embark_internal', path: "js/build/embark.bundle.js"}));
          //}

            return file.content(function(fileContent) {
              return fileCb(null, {content: fileContent + "\n" + abi, filename: file.filename, path: file.path, modified: true});
            });


          } else if (file.filename === 'abi.js') {
            return fileCb(null, {content: abi, filename: file.filename, path: file.path, modified: true});
          } else if (['web3.js', 'ipfs.js', 'ipfs-api.js', 'orbit.js'].indexOf(file.filename) >= 0) {
            file.content(function(fileContent) {
              return fileCb(null, {content: fileContent, filename: file.filename, path: file.path, modified: true});
            });
          } else {

            if (pipelinePlugins.length > 0) {
              file.content(function(fileContent) {
                async.eachSeries(pipelinePlugins, function(plugin, pluginCB) {
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
                  return fileCb(null, {content: fileContent, filename: file.filename, path: file.path, modified: true});
                });
              });
            } else {
              file.content(function(fileContent) {
                return fileCb(null, {content: fileContent, filename: file.filename, path: file.path, modified: true});
              });
            }

          //if (file.indexOf('.js') >= 0) {
          ////if (file.indexOf('.js') >= 0) {
          //  readFiles.push(new File({filename: file, type: "custom", path: file, resolver: function(fileCallback) {
          //    console.log("---");
          //    console.log(fs.dappPath());
          //    console.log(file);
          //    console.log("---");
//
          //    let importsList = {};
          //    async.waterfall([
          //      function findImports(next) {
          //        webpack({
          //          entry: utils.joinPath(fs.dappPath(), file),
          //          output: {
          //            libraryTarget: 'umd',
          //            path: utils.joinPath(fs.dappPath(), '.embark'),
          //            filename: file
          //          },
          //          externals: function(context, request, callback) {
          //            if (request === utils.joinPath(fs.dappPath(), file)) {
          //              callback();
          //            } else {
          //              if (request === "Embark/EmbarkJS") {
          //                importsList["Embark/EmbarkJS"] = fs.embarkPath("js/embark.js");
          //              } else if (request === "Embark/test") {
          //                importsList["Embark/test"] = fs.embarkPath("js/test.js");
          //              }
          //              callback(null, "amd " + Math.random());
          //            }
          //          },
          //          module: {
          //            rules: [
          //              {
          //                test: /\.css$/,
          //                use: [
          //                  { loader: "style-loader" },
          //                  { loader: "css-loader" }
          //                ]
          //              }
          //            ]
          //          }
          //        }).run((err, stats) => {
          //          next();
          //        });
          //      },
//
          //      function runWebpack(next) {
          //        webpack({
          //          entry: utils.joinPath(fs.dappPath(), file),
          //          output: {
          //            libraryTarget: 'umd',
          //            path: utils.joinPath(fs.dappPath(), '.embark'),
          //            filename: file
          //          },
          //          resolve: {
          //            alias: importsList
          //          },
          //          externals: function(context, request, callback) {
          //              if (request === "Embark/contracts/all") {
          //                return callback(null, fs.readFileSync(utils.joinPath(fs.dappPath(), '.embark', 'embark.js')));
          //              }
          //              callback();
          //          },
          //          module: {
          //            rules: [
          //              {
          //                test: /\.css$/,
          //                use: [
          //                  { loader: "style-loader" },
          //                  { loader: "css-loader" }
          //                ]
          //              }
          //            ]
          //          }
          //        }).run((err, stats) => {
          //          next();
          //        });
//
          //      }
//
          //    ], function(err, _result) {
          //      fileCallback(fs.readFileSync('./.embark/' + file).toString());
          //    });
//
          //  }}));
//
          //}




          }
        },
        function (err, contentFiles) {
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
  }

  buildContracts(contractsJSON) {
    fs.mkdirpSync(this.buildDir + 'contracts');

    for (let className in contractsJSON) {
      let contract = contractsJSON[className];
      fs.writeJSONSync(this.buildDir + 'contracts/' + className + ".json", contract, {spaces: 2});
    }
  }

  buildContractJS(contractName) {
    let contractJSON = fs.readFileSync('dist/contracts/' + contractName + '.json').toString();
    //let EmbarkJSLib  = fs.readFileSync(fs.embarkPath("js/embark.js")).toString();

    let contractCode = "";
    contractCode += "import web3 from 'Embark/web3';\n";
    contractCode += "import EmbarkJS from 'Embark/EmbarkJS';\n";
    contractCode += "let " + contractName + "JSONConfig = " + contractJSON + ";\n";
    //contractCode += contractName + "JSONConfig.web3 = window.web3;\n";
    //contractCode += EmbarkJSLib + "\n";
    contractCode += "let " + contractName + " = new EmbarkJS.Contract(" + contractName + "JSONConfig);\n";
    //contractCode += "if (typeof module !== 'undefined' && module.exports) {\n";
    //contractCode += "module.exports = " + contractName + ";\n";
    //contractCode += "}\n";
    //contractCode += "window.contractWeb3 = web3;\n";

    // on ready
    // contractName.setProvider(web3.currentProvider
    //ontractCode += "\n__embarkContext.__loadManagerInstance.execWhenReady(function() {\n";
    contractCode += "\n__embarkContext.execWhenReady(function() {\n";
    contractCode += "\nconsole.log('ready to set provider');\n";
    contractCode += "\n" + contractName + ".setProvider(web3.currentProvider);\n";
    contractCode += "\n});\n";

    contractCode += "export default " + contractName + ";\n";

    return contractCode;
  }
}

module.exports = Pipeline;

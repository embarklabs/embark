let fs = require('../core/fs.js');
let async = require('async');
var utils = require('../utils/utils.js');
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

      let importsList = {};

      importsList["Embark/EmbarkJS"] = fs.dappPath(".embark", 'embark.js');
      importsList["Embark/web3"] = fs.dappPath(".embark", 'web3_instance.js');

      self.plugins.getPluginsProperty('imports', 'imports').forEach(function (importObject) {
          let [importName, importLocation] = importObject;
          importsList[importName] = importLocation;
      });

      for (let contractName in contractsJSON) {
          let contractCode = self.buildContractJS(contractName);
          let filePath = fs.dappPath(".embark", contractName + '.js');
          fs.writeFileSync(filePath, contractCode);
          importsList["Embark/contracts/" + contractName] = filePath;
      }

      // limit:1 due to issues when downloading required files such as web3.js
      async.eachOfLimit(self.assetFiles, 1, function (files, targetFile, cb) {
        // limit:1 due to issues when downloading required files such as web3.js
        async.mapLimit(files, 1,
          function(file, fileCb) {
            self.logger.trace("reading " + file.filename);

            if (file.filename.indexOf('.js') >= 0) {

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

                //function findImportsPhase2(next) {
                //  console.log("====> findImports_2");
                //  self.webpackRun(file.filename, {
                //    externals: function(context, request, callback) {
                //      if (request === utils.joinPath(fs.dappPath(), file.filename)) {
                //        callback();
                //      } else {
                //        //if (request.indexOf('Embark/contracts/') === 0) {
                //        //  let contractName = request.split('/')[2];
                //        //  let contractCode = self.buildContractJS(contractName);
                //        //  let filePath = utils.joinPath(fs.dappPath(), ".embark", contractName + '.js');
                //        //  fs.writeFileSync(filePath, contractCode);
                //        //  importsList[request] = filePath;
                //        //}
                //        callback(null, "amd " + Math.random());
                //      }
                //    }
                //  }, true, importsList, next);
                //},

                function runWebpack(next) {
                  self.webpackRun(file.filename, {}, true, importsList, true, next);
                },

                function changeCwdBack(next) {
                  process.chdir(realCwd);
                  next();
                }

              ], function(err, _result) {
                if (err) {
                  process.chdir(realCwd);
                  self.logger.error(err);
                  return fileCb(err);
                }
                if (!fs.existsSync('./.embark/' + file.filename)) {
                  self.logger.error("couldn't find file: " + file.filename);
                  return fileCb("couldn't find file: " + file.filename);
                }
                let fileContent = fs.readFileSync('./.embark/' + file.filename).toString();
                self.runPlugins(file, fileContent, fileCb);
              });
            } else {
              file.content(function(fileContent) {
                self.runPlugins(file, fileContent, fileCb);
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
                let filename = file.filename.replace(file.basedir + '/', '');
                self.logger.info("writing file " + (self.buildDir + targetDir + filename).bold.dim);

                fs.copySync(file.path, self.buildDir + targetDir + filename, {overwrite: true});
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

  runPlugins(file, fileContent, fileCb) {
    const self = this;
    let pipelinePlugins = self.plugins.getPluginsFor('pipeline');
    if (pipelinePlugins.length <= 0) {
      return fileCb(null, {content: fileContent, filename: file.filename, path: file.path, basedir: file.basedir, modified: true});
    }
    async.eachSeries(pipelinePlugins,
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
      externals: function(context, request, callback) {
        callback();
      }
    };

    let webpackOptions =  utils.recursiveMerge(defaultOptions, options);

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
      if (!detectErrors) {
        return callback();
      }

      if (_stats.hasErrors()) {
        return callback(_stats.toJson().errors.join("\n"));
      }
      callback();
    });
  }

  buildContracts(contractsJSON) {
    fs.mkdirpSync(fs.dappPath(this.buildDir, 'contracts'));

    for (let className in contractsJSON) {
      let contract = contractsJSON[className];
      fs.writeJSONSync(fs.dappPath(this.buildDir, 'contracts', className + ".json"), contract, {spaces: 2});
    }
  }

  buildContractJS(contractName) {
    let contractJSON = fs.readFileSync(fs.dappPath(this.buildDir, 'contracts', contractName + '.json')).toString();

    let contractCode = "";
    contractCode += "import web3 from 'Embark/web3';\n";
    contractCode += "import EmbarkJS from 'Embark/EmbarkJS';\n";
    contractCode += "let " + contractName + "JSONConfig = " + contractJSON + ";\n";
    contractCode += "let " + contractName + " = new EmbarkJS.Contract(" + contractName + "JSONConfig);\n";

    contractCode += "\n__embarkContext.execWhenReady(function() {\n";
    contractCode += "\n" + contractName + ".setProvider(web3.currentProvider);\n";
    contractCode += "\n" + contractName + ".options.from = web3.eth.defaultAccount;\n";
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
              return next(null, fs.dappPath(location));
            });
          }
        });
      },
      function getImports(web3Location, next) {
        web3Location = web3Location.replace(/\\/g, '/'); // Import paths must always have forward slashes
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
        fs.mkdirpSync(fs.dappPath(".embark"));
        fs.writeFileSync(fs.dappPath(".embark", 'web3_instance.js'), code);
        next();
      }
    ], function(_err, _result) {
      cb();
    });
  }

}

module.exports = Pipeline;

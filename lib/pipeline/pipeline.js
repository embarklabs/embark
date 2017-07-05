/*jshint esversion: 6, loopfunc: true */
let fs = require('../core/fs.js');
let async = require('async');

class Pipeline {

  constructor(options) {
    this.buildDir = options.buildDir;
    this.contractsFiles = options.contractsFiles;
    this.assetFiles = options.assetFiles;
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
    function (err, results) {
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
    contractCode += "let " + contractName + "JSONConfig = " + contractJSON + ";\n";
    //contractCode += EmbarkJSLib + "\n";
    contractCode += "let " + contractName + " = new EmbarkJS.Contract(" + contractName + "JSONConfig);\n";
    contractCode += "if (typeof module !== 'undefined' && module.exports) {\n";
    contractCode += "module.exports = " + contractName + ";\n";
    contractCode += "}\n";

    return contractCode;
  }
}

module.exports = Pipeline;


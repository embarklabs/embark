/*jshint esversion: 6, loopfunc: true */
let fs = require('../core/fs.js');

class Pipeline {

  constructor(options) {
    this.buildDir = options.buildDir;
    this.contractsFiles = options.contractsFiles;
    this.assetFiles = options.assetFiles;
    this.logger = options.logger;
    this.plugins = options.plugins;
  }

  build(abi, contractsJSON, path) {
    let self = this;
    for (let targetFile in this.assetFiles) {

      let contentFiles = this.assetFiles[targetFile].map(file => {
        self.logger.trace("reading " + file.filename);

        let pipelinePlugins = this.plugins.getPluginsFor('pipeline');

        if (file.filename === 'embark.js') {
          return {content: file.content + "\n" + abi, filename: file.filename, path: file.path, modified: true};
        } else if (file.filename === 'abi.js') {
          return {content: abi, filename: file.filename, path: file.path, modified: true};
        } else if (['web3.js', 'ipfs.js', 'ipfs-api.js', 'orbit.js'].indexOf(file.filename) >= 0) {
          file.modified = true;
          return file;
        } else {

          if (pipelinePlugins.length > 0) {
            pipelinePlugins.forEach(function (plugin) {
              try {
                if (file.options && file.options.skipPipeline) {
                  return;
                }
                file.content = plugin.runPipeline({targetFile: file.filename, source: file.content});
                file.modified = true;
              }
              catch (err) {
                self.logger.error(err.message);
              }
            });
          }

          return file;
        }
      });

      let dir = targetFile.split('/').slice(0, -1).join('/');
      self.logger.trace("creating dir " + this.buildDir + dir);
      fs.mkdirpSync(this.buildDir + dir);

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
          return file.content;
        }).join("\n");

        self.logger.info("writing file " + (this.buildDir + targetFile).bold.dim);
        fs.writeFileSync(this.buildDir + targetFile, content);
      }
    }

    this.buildContracts(contractsJSON);
  }

  buildContracts(contractsJSON) {
    fs.mkdirpSync(this.buildDir + 'contracts');

    for (let className in contractsJSON) {
      let contract = contractsJSON[className];
      fs.writeJSONSync(this.buildDir + 'contracts/' + className + ".json", contract, {spaces: 2});
    }
  }
}

module.exports = Pipeline;


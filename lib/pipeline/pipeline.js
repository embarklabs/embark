/*jshint esversion: 6, loopfunc: true */
var fs = require('../core/fs.js');

var Pipeline = function(options) {
  this.buildDir = options.buildDir;
  this.contractsFiles = options.contractsFiles;
  this.assetFiles = options.assetFiles;
  this.logger = options.logger;
  this.plugins = options.plugins;
};

Pipeline.prototype.build = function(abi, path) {
  var self = this;
  for(var targetFile in this.assetFiles) {

    var contentFiles = this.assetFiles[targetFile].map(file => {
      self.logger.trace("reading " + file.filename);

      var pipelinePlugins = this.plugins.getPluginsFor('pipeline');

      if (file.filename === 'embark.js') {
        return {content: file.content + "\n" + abi, filename: file.filename, path: file.path, modified: true};
      } else if (file.filename === 'abi.js') {
        return {content: abi, filename: file.filename, path: file.path, modified: true};
      } else if (['web3.js', 'ipfs.js', 'ipfs-api.js', 'orbit.js'].indexOf(file.filename) >= 0) {
        file.modified = true;
        return file;
      } else {

        if (pipelinePlugins.length > 0) {
          pipelinePlugins.forEach(function(plugin) {
            try {
              if (file.options && file.options.skipPipeline) {
                return;
              }
              file.content = plugin.runPipeline({targetFile: file.filename, source: file.content});
              file.modified = true;
            }
            catch(err) {
              self.logger.error(err.message);
            }
          });
        }

        return file;
      }
    });

    var dir = targetFile.split('/').slice(0, -1).join('/');
    self.logger.trace("creating dir " + this.buildDir + dir);
    fs.mkdirpSync(this.buildDir + dir);

    // if it's a directory
    if (targetFile.slice(-1) === '/' || targetFile.indexOf('.') === -1) {
      var targetDir = targetFile;

      if (targetDir.slice(-1) !== '/') {
        targetDir = targetDir + '/';
      }

      contentFiles.map(function(file) {
        var filename = file.filename.replace('app/', '');
        filename = filename.replace(targetDir, '');
        self.logger.info("writing file " + (self.buildDir + targetDir + filename).bold.dim);

        fs.copySync(self.buildDir + targetDir + filename, file.path, {overwrite: true});
      });
    } else {
      var content = contentFiles.map(function(file) {
        return file.content;
      }).join("\n");

      self.logger.info("writing file " + (this.buildDir + targetFile).bold.dim);
      fs.writeFileSync(this.buildDir + targetFile, content);
    }
  }
};

module.exports = Pipeline;


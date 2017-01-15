/*jshint esversion: 6, loopfunc: true */
var fs = require('fs');
var mkdirp = require('mkdirp');

var Pipeline = function(options) {
  this.buildDir = options.buildDir;
  this.contractsFiles = options.contractsFiles;
  this.assetFiles = options.assetFiles;
  this.logger = options.logger;
  this.plugins = options.plugins;
};

Pipeline.prototype.build = function(abi) {
  var self = this;
  for(var targetFile in this.assetFiles) {

    // TODO: run the plugin here instead, for each file

    var content = this.assetFiles[targetFile].map(file => {
      self.logger.info("reading " + file.filename);

      var pipelinePlugins = this.plugins.getPluginsFor('pipeline');

      if (file.filename === 'embark.js') {
        return file.content + "\n" + abi;
      } else if (['web3.js', 'ipfs.js', 'ipfs-api.js', 'orbit.js'].indexOf(file.filename) >= 0) {
        return file.content;
      } else {

        if (pipelinePlugins.length > 0) {
          pipelinePlugins.forEach(function(plugin) {
            file.content = plugin.runPipeline({targetFile: file.filename, source: file.content});
          });
        }

        return file.content;
      }
    }).join("\n");

    var dir = targetFile.split('/').slice(0, -1).join('/');
    self.logger.info("creating dir " + this.buildDir + dir);
    mkdirp.sync(this.buildDir + dir);

    self.logger.info("writing file " + this.buildDir + targetFile);
    fs.writeFileSync(this.buildDir + targetFile, content);
  }
};

module.exports = Pipeline;


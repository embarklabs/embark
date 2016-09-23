var fs = require('fs');
var grunt = require('grunt');
var mkdirp = require('mkdirp');

var Pipeline = function(options) {
  this.buildDir = options.buildDir;
  this.contractsFiles = options.contractsFiles;
  this.assetFiles = options.assetFiles;
  this.logger = options.logger;
};

Pipeline.prototype.build = function(abi) {
  var self = this;
  for(var targetFile in this.assetFiles) {

    var content = this.assetFiles[targetFile].map(function(file) {
      self.logger.info("reading " + file.filename);
      if (file.filename === 'embark.js') {
        return file.content + "\n" + abi;
      } else {
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


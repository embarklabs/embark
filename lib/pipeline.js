var fs = require('fs');
var grunt = require('grunt');
var mkdirp = require('mkdirp');

var Pipeline = function(options) {
  this.options = options;
};

Pipeline.prototype.build = function(abi) {
  var embarkConfig = JSON.parse(fs.readFileSync("embark.json"));

  var appConfig = embarkConfig.app;

  for(var targetFile in appConfig) {
    var originalFiles = grunt.file.expand({nonull: true}, appConfig[targetFile]);
    console.log(originalFiles);
    // remove duplicates

    var content = originalFiles.filter(function(file) {
      return file.indexOf('.') >= 0;
    }).map(function(file) {
      console.log("reading " + file);
      if (file === 'embark.js') {
        return fs.readFileSync("../js/bluebird.js") + fs.readFileSync("../js/web3.js") + fs.readFileSync("../js/embark.js")  + "\n" + abi;
      } else {
        return fs.readFileSync(file);
      }
    }).join("\n");

    var dir = targetFile.split('/').slice(0, -1).join('/');
    console.log("creating dir " + "dist/" + dir);
    mkdirp.sync("dist/" + dir);

    //console.log(content);
    fs.writeFileSync("dist/" + targetFile, content);
  }
};

module.exports = Pipeline;


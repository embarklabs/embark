var fs = require('fs');
var chokidar = require('chokidar');

var Watch = function(options) {
  this.options = options;
};

Watch.prototype.start = function() {
  var embarkConfig = JSON.parse(fs.readFileSync("embark.json"));

  var appConfig = embarkConfig.app;
  var filesToWatch = [];

  for(var targetFile in appConfig) {
    filesToWatch.push(appConfig[targetFile]);
  }

  // TODO: add callback to ready
  console.log(filesToWatch);
  var watcher = chokidar.watch(filesToWatch, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true,
    followSymlinks: true
  });
  watcher
  .on('add',    path => console.log(`File ${path} has been added`))
  .on('change', path => console.log(`File ${path} has been changed`))
  .on('unlink', path => console.log(`File ${path} has been removed`))
  .on('ready', () => console.log('ready to watch changes'));
  console.log("done!");
};

module.exports = Watch;

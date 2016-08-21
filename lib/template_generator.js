// TODO: replace with something else more native to node
require('shelljs/global');
var path = require('path');
var wrench = require('wrench');

var run = function(cmd) {
  if (exec(cmd).code !== 0) {
    exit();
  }
};

var TemplateGenerator = function(templateName) {
  this.templateName = templateName;
};

TemplateGenerator.prototype.generate = function(destinationFolder, name) {
  var templatePath = path.join(__dirname + '/../' + this.templateName);

  wrench.copyDirSyncRecursive(templatePath, destinationFolder + name);

  cd(destinationFolder + name);
  run('npm install');
  console.log('\n\ninit complete'.green);
  console.log('\n\app ready at '.green + destinationFolder + name);
};

module.exports = TemplateGenerator;

// TODO: replace with something else more native to node
require('shelljs/global');
var wrench = require('wrench');
var utils = require('./utils.js');

var run = function(cmd) {
  var result = exec(cmd, {silent: true});
  if (result.code !== 0) {
    console.log("error doing.. " + cmd);
    console.log(result.output);
    if (result.stderr !== undefined) {
      console.log(result.stderr);
    }
    exit();
  }
};

var TemplateGenerator = function(templateName) {
  this.templateName = templateName;
};

TemplateGenerator.prototype.generate = function(destinationFolder, name) {
  var templatePath = utils.joinPath(__dirname, '/../', this.templateName);
  console.log('Initializing Embark Template....'.green);

  wrench.copyDirSyncRecursive(templatePath, destinationFolder + name);
  cd(destinationFolder + name);

  console.log('Installing packages.. this can take a few seconds'.green);
  run('npm install');
  console.log('Init complete'.green);
  console.log('\nApp ready at '.green + destinationFolder + name);

  if (name === 'embark_demo') {
    console.log('-------------------'.yellow);
    console.log('next steps:'.green);
    console.log(('-> cd ' + destinationFolder + name).green);
    console.log('-> embark blockchain or embark simulator'.green);
    console.log('open another console in the same directory and run'.green);
    console.log('-> embark run'.green);
    console.log('For more info go to http://github.com/iurimatias/embark-framework'.green);
  }
};

module.exports = TemplateGenerator;

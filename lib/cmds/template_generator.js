var fs = require('../core/fs.js');
var utils = require('../core/utils.js');

var TemplateGenerator = function(templateName) {
  this.templateName = templateName;
};

TemplateGenerator.prototype.generate = function(destinationFolder, name) {
  var templatePath = fs.embarkPath(this.templateName);
  console.log('Initializing Embark Template....'.green);

  fs.copySync(templatePath, destinationFolder + name);
  utils.cd(destinationFolder + name);
  utils.sed('package.json', '%APP_NAME%', name);

  console.log('Installing packages.. this can take a few seconds'.green);
  utils.runCmd('npm install');
  console.log('Init complete'.green);
  console.log('\nApp ready at '.green + destinationFolder + name);

  if (name === 'embark_demo') {
    console.log('-------------------'.yellow);
    console.log('Next steps:'.green);
    console.log(('-> ' + ('cd ' + destinationFolder + name).bold.cyan).green);
    console.log('-> '.green + 'embark blockchain'.bold.cyan + ' or '.green + 'embark simulator'.bold.cyan);
    console.log('open another console in the same directory and run'.green);
    console.log('-> '.green + 'embark run'.bold.cyan);
    console.log('For more info go to http://github.com/iurimatias/embark-framework'.green);
  }
};

module.exports = TemplateGenerator;

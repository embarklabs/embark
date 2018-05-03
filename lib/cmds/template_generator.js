let fs = require('../core/fs.js');
let utils = require('../utils/utils.js');

class TemplateGenerator {
  constructor(templateName) {
    this.templateName = templateName;
  }

  generate(destinationFolder, name) {
    let templatePath = fs.embarkPath(utils.joinPath('templates', this.templateName));
    console.log('Initializing Embark Template....'.green);
    let fspath = utils.joinPath(destinationFolder, name);

    fs.copySync(templatePath, fspath);
    utils.cd(fspath);
    utils.sed('package.json', '%APP_NAME%', name);

    if (name === 'embark_demo') {
      console.log('Installing packages...'.green);
      utils.runCmd('npm install');
    }

    console.log('Init complete'.green);
    console.log('\nApp ready at '.green + fspath);

    if (name === 'embark_demo') {
      console.log('-------------------'.yellow);
      console.log('Next steps:'.green);
      console.log(('-> ' + ('cd ' + fspath).bold.cyan).green);
      console.log('-> '.green + 'embark blockchain'.bold.cyan + ' or '.green + 'embark simulator'.bold.cyan);
      console.log('open another console in the same directory and run'.green);
      console.log('-> '.green + 'embark run'.bold.cyan);
      console.log('For more info go to http://embark.status.im'.green);
    }
  }
}

module.exports = TemplateGenerator;

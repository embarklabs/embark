let fs = require('../core/fs.js');
let hostedGitInfo = require('hosted-git-info');
let utils = require('./utils.js');

class TemplateGenerator {
  constructor(templateName) {
    this.templateName = templateName;
  }

  checkPathExists(fspath) {
    if (fs.existsSync(fspath)) {
      console.error(`${fspath} already exists, will not overwrite`.red);
      process.exit(1);
    }
  }

  downloadAndGenerate(uri, destinationFolder, name) {
    const fspath = utils.joinPath(destinationFolder, name);
    this.checkPathExists(fspath);
    const self = this;
    let ext;
    try {
      ext = this.getExternalProject(uri);
    } catch (e) {
      console.error(utils.errorMessage(e).red);
      process.exit(1);
    }
    let {url, filePath, browse} = ext;
    let tmpFilePath = fs.tmpDir(filePath);
    console.log(__('Installing template from ' + browse).green);
    console.log(__('Downloading template...').green);

    fs.mkdirpSync(utils.dirname(tmpFilePath));
    utils.downloadFile(url, tmpFilePath, (err) => {
      if (err) {
        console.error(err.red);
        console.error('Does the template really exist?'.red);
        console.error(`Embark's supported templates: https://embark.status.im/templates/`.green);
        process.exit(1);
      }
      utils.extractZip(tmpFilePath, fspath, {
        map: file => {
          let fixed_path = file.path.split('/');
          fixed_path.shift(); // remove first directory
          file.path = utils.joinPath(...fixed_path);
          return file;
        }
      }, () => {
        self.installTemplate(fspath, name, true);
      });
    });
  }

  generate(destinationFolder, name) {
    const fspath = utils.joinPath(destinationFolder, name);
    this.checkPathExists(fspath);
    console.log(__('Initializing Embark template...').green);
    let templatePath = fs.embarkPath(utils.joinPath('templates', this.templateName));
    fs.copySync(templatePath, fspath);

    this.installTemplate(
      fspath,
      name,
      (this.templateName === 'boilerplate' || this.templateName === 'demo')
    );

    if (name === 'embark_demo') {
      console.log('-------------------'.yellow);
      console.log(__('Next steps:').green);
      console.log(('-> ' + ('cd ' + fspath).bold.cyan).green);
      console.log('-> '.green + 'embark run'.bold.cyan);
      console.log(__('For more info go to http://embark.status.im').green);
    }
  }

  installTemplate(templatePath, name, installPackages) {
    utils.cd(templatePath);
    utils.sed('package.json', '%APP_NAME%', name);
    if (fs.existsSync('dot.gitignore')) {
      fs.moveSync('dot.gitignore', '.gitignore');
    }

    if (fs.existsSync('dot.gitignore')) {
      fs.moveSync('dot.gitignore', '.gitignore');
    }

    if (installPackages) {
      console.log(__('Installing packages...').green);
      utils.runCmd('npm install', null, (err) => {
        if (err) {
          return console.error(err.red);
        }
        console.log(__('Init complete').green);
        console.log('\n' + __('App ready at ').green + templatePath);
      });
    }
  }

  getExternalProject(uri) {
    let url, folder, hgi;
    hgi = hostedGitInfo.fromUrl(uri);
    if (!hgi || hgi.user.includes('#')) {
      let templateAndBranch = uri.split('#');
      templateAndBranch[0] = `embark-framework/embark-${templateAndBranch[0]}-template`;
      hgi = hostedGitInfo.fromUrl(templateAndBranch.join('#'));
    }
    if(!hgi) { throw new Error('Unsupported template name or git host URL'); }
    url = hgi.tarball();
    folder = `${hgi.user}/${hgi.project}/${hgi.committish || 'master'}`;

    return {
      url,
      filePath: utils.joinPath(".embark/templates/", folder, "archive.zip"),
      browse: decodeURIComponent(hgi.browse())
    };
  }
}
module.exports = TemplateGenerator;

let fs = require('../core/fs.js');
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
    let {url, filePath} = this.getExternalProject(uri);
    let tmpFilePath = fs.tmpDir(filePath);
    console.log(__('Installing Template from ' + uri + '....').green);

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
    console.log(__('Initializing Embark Template...').green);

    let templatePath = fs.embarkPath(utils.joinPath('templates', this.templateName));
    fs.copySync(templatePath, fspath);

    this.installTemplate(fspath, name, (name === 'embark_demo'));

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
      utils.runCmd('npm install');
    }

    console.log(__('Init complete').green);
    console.log('\n' + __('App ready at ').green + templatePath);
  }

  extractGithubUrlAndFolder(uri){

    /*  first matching group is the url, second the repoPart and third the branch with a hash in the beginning (if existing)
        e.g. (["git@github.com/status-im/dappcon-workshop-dapp#master", "status-im/dappcon-workshop-dapp", "#master" ])
        should work with all formats of the following:
        * git@github.com/status-im/dappcon-workshop-dapp#start-here
        * git@github.com/status-im/dappcon-workshop-dapp
        * http://www.github.com/status-im/dappcon-workshop-dapp
        * https://www.github.com/status-im/dappcon-workshop-dapp
        * github.com/status-im/dappcon-workshop-dapp#start-here

        sadly it doesn't extract from http(s)://github.com/status-im/dappcon-workshop-dapp/tree/start-here
        thats why we have a special case later
    */
    const match = uri.match(/github\.com+\/(.+?)(#.*)?$/);
    const githubPart = "https://github.com/";
    let repoPart = match !== null? match[1] : null;
    let branchName = match !== null? match[2] : null;

    if (branchName && branchName !== '#'){
      branchName = branchName.substring(1);
    } else {
      branchName = "master";
    }

    let url, folder;
    if (uri.includes("/tree")){
    //e.g http(s)://github.com/status-im/dappcon-workshop-dapp/tree/start-here
      let repoPartAndBranch = repoPart.split("/tree/");
      repoPart = repoPartAndBranch[0];
      branchName = repoPartAndBranch[1];
      url = "https://github.com/" + repoPart + "/archive/"+ branchName +".zip";
      folder = repoPart + "/" + branchName;
    } else if (repoPart !== undefined) {
      url = githubPart + repoPart + "/archive/" + branchName + ".zip";
      folder = repoPart + "/" + branchName;
   }

    return {
      'url': url,
      'folder': folder
    };
  }

  getExternalProject(uri) {
    let url, folder;
    const regex = /^((git@)?(www\.)?github\.com\/)|(https?:\/\/)/;
    if (!uri.match(regex) && uri.split('/').length >= 2) {
      //e.g embark-framework/embark, embark-framework/embark#branch, embark-framework/embark#features/branch
      let repoPartAndBranch = uri.split('#');
      let repoPart = repoPartAndBranch[0];
      let branchName = (repoPartAndBranch.length === 2)? repoPartAndBranch[1] : "master";
      url = "https://github.com/" + repoPart + "/archive/"+ branchName + ".zip";
      folder = repoPart + "/" + branchName;
    } else if (uri.indexOf('/') === -1) {
      url = "https://github.com/embark-framework/embark-" + uri + "-template/archive/master.zip";
      folder = "embark-framework/embark-" + uri + "-template";
    } else {
      let urlAndFolder = this.extractGithubUrlAndFolder(uri);
      url = urlAndFolder.url;
      folder = urlAndFolder.folder;
    }

    return {
      url,
      filePath: utils.joinPath(".embark/templates/", folder, "archive.zip")
    };
  }
}
module.exports = TemplateGenerator;

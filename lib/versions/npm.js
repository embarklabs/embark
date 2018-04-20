// here be dragons
// TODO: this is horrible and needs to be refactored ASAP
let utils = require('../utils/utils.js');
let fs = require('../core/fs.js');

let PluginManager = require('live-plugin-manager').PluginManager;

class Npm {

  constructor(options) {
    this.logger = options.logger;
  }

  downloadFromGit(registryJSON, packageName, version, returnContent, callback) {
    console.dir("==== downloadFromGit ");
    console.dir(arguments);



    callback(null, "");
  }

  old_downloadFromGit(registryJSON, packageName, version, returnContent, callback) {
    let repoName = registryJSON.repository.url.replace("git+https://github.com/", "").replace(".git","");
    let gitHead = registryJSON.gitHead;
    console.dir(registryJSON);

    if (!gitHead) {
      this.logger.error("Could not download " + packageName + " " + version);
      return callback("error");
    }

    let fileLocation = "https://raw.githubusercontent.com/" + repoName + "/" + gitHead + "/dist/web3.min.js";
    console.dir("fileLocation is " + fileLocation);

    let packageDirectory = './.embark/versions/' + packageName + '/' + version + '/';
    console.dir("packageDirectory is " + packageDirectory);
    if (fs.existsSync(packageDirectory + "/" + packageName + ".js")) {
      if (returnContent) {
        let distFile = packageDirectory + packageName + ".js";
        callback(null, fs.readFileSync(distFile).toString());
      } else {
        callback(null, packageDirectory);
      }
    } else {
      fs.mkdirpSync(packageDirectory);
      this.logger.info("downloading " + packageName + " " + version + "....");

      utils.downloadFile(fileLocation, packageDirectory + "/" + packageName + ".js", function() {
        utils.extractTar(packageDirectory + "/" + packageName + ".js", packageDirectory, function() {
          if (returnContent) {
            let distFile = packageDirectory + packageName + ".js";
            callback(null, fs.readFileSync(distFile).toString());
          } else {
            callback(null, packageDirectory);
          }
        });
      });
    }
  }


  downloadFromNpm(packageName, version, returnContent, callback) {
    let packageDirectory = './.embark/versions/' + packageName + '/' + version + '/';
    console.dir("packageDirectory: " + packageDirectory);

    let manager = new PluginManager({pluginsPath: packageDirectory});

    if (fs.existsSync(packageDirectory + packageName)) {
      return callback(null, packageDirectory + packageName);
    }

    this.logger.info("downloading " + packageName + " " + version + "....");
    manager.install(packageName, version).then((result) => {
      console.dir("== result");
      console.dir(result);
      if (returnContent) {
        callback(null , fs.readFileSync(result.mainFile).toString());
      } else {
        callback(null , result.location);
      }
    }).catch((error) => {
      console.dir("======> error");
      console.dir(error);
      callback(error);
    });
  }

  old_downloadFromNpm(registryJSON, packageName, version, returnContent, callback) {
    let tarball = registryJSON.dist.tarball;

    let packageDirectory = './.embark/versions/' + packageName + '/' + version + '/';
    if (fs.existsSync(packageDirectory + "/downloaded_package.tgz") && fs.existsSync(packageDirectory + "package.json")) {
      if (returnContent) {
        let distFile = packageDirectory + returnContent;
        callback(null, fs.readFileSync(distFile).toString());
      } else {
        callback(null, packageDirectory);
      }
    } else {
      fs.mkdirpSync(packageDirectory);
      this.logger.info("downloading " + packageName + " " + version + "....");

      utils.downloadFile(tarball, packageDirectory + "/downloaded_package.tgz", function() {
        utils.extractTar(packageDirectory + "/downloaded_package.tgz", packageDirectory, function() {
          if (returnContent) {
            let distFile = packageDirectory + returnContent;
            callback(null, fs.readFileSync(distFile).toString());
          } else {
            callback(null, packageDirectory);
          }
        });
      });
    }
  }

  // TODO: callback should accept an error
  getPackageVersion(packageName, version, returnContent, getFromGit, callback) {
    console.dir(arguments);
    let self = this;
    let npmRegistry = "https://registry.npmjs.org/" + packageName + "/" + version;
    let packageDirectory = './.embark/versions/' + packageName + '/' + version + '/';

    self.downloadFromNpm(packageName, version, returnContent, callback);

    //if (fs.existsSync(packageDirectory) && fs.existsSync(packageDirectory + "package.json")) {
    //  let content;
    //  if (getFromGit && returnContent) {
    //    let distFile = packageDirectory + packageName + ".js";
    //    content = fs.readFileSync(distFile).toString();
    //  } else if (returnContent) {
    //    let distFile = packageDirectory + returnContent;
    //    content = fs.readFileSync(distFile).toString();
    //  } else {
    //    content = packageDirectory;
    //  }
    //  return callback(null, content);
    //}

    //utils.httpsGet(npmRegistry, function (err, body) {
    //  if (err) {
    //    if (err.code === 'ENOTFOUND') {
    //      return callback("can't reach " + err.hostname + " to download " + packageName + " " + version + " - are you connected to the internet?");
    //    }
    //    return callback(err);
    //  }
    //  let registryJSON = JSON.parse(body);

    //  if (getFromGit) {
    //    self.downloadFromGit(registryJSON, packageName, version, returnContent, callback);
    //  } else {
    //    self.downloadFromNpm(registryJSON, packageName, version, returnContent, callback);
    //  }
    //});
  }
}

module.exports = Npm;

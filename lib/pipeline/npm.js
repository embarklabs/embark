// here be dragons
// TODO: this is horrible and needs to be refactored ASAP
let utils = require('../utils/utils.js');
let fs = require('../core/fs.js');

class Npm {

  constructor(options) {
    this.logger = options.logger;
  }

  // TODO: callback should accept an error
  getPackageVersion(packageName, version, returnContent, getFromGit, callback) {
    let self = this;
    let npmRegistry = "https://registry.npmjs.org/" + packageName + "/" + version;

    utils.httpsGet(npmRegistry, function (_err, body) {
      let registryJSON = JSON.parse(body);

      let tarball = registryJSON.dist.tarball;

      if (getFromGit) {
        let repoName = registryJSON.repository.url.replace("git+https://github.com/", "").replace(".git","");
        let gitHead = registryJSON.gitHead;

        if (!gitHead) {
          console.error("Could not download " + packageName + " " + version);
          return callback("error");
        }

        let fileLocation = "https://raw.githubusercontent.com/" + repoName + "/" + gitHead + "/dist/web3.min.js";

        let packageDirectory = './.embark/versions/' + packageName + '/' + version + '/';
        if (fs.existsSync(packageDirectory + "/" + packageName + ".js")) {
          if (returnContent) {
            let distFile = packageDirectory + packageName + ".js";
            callback(fs.readFileSync(distFile).toString());
          } else {
            callback(packageDirectory);
          }
        } else {
          fs.mkdirpSync(packageDirectory);
          self.logger.info("downloading " + packageName + " " + version + "....");

          utils.downloadFile(fileLocation, packageDirectory + "/" + packageName + ".js", function() {
            utils.extractTar(packageDirectory + "/" + packageName + ".js", packageDirectory, function() {
                if (returnContent) {
                  let distFile = packageDirectory + packageName + ".js";
                  callback(fs.readFileSync(distFile).toString());
                } else {
                  callback(packageDirectory);
                }
            });
          });
        }

      } else {

        let packageDirectory = './.embark/versions/' + packageName + '/' + version + '/';
        if (fs.existsSync(packageDirectory + "/downloaded_package.tgz")) {
          if (returnContent) {
            let distFile = packageDirectory + returnContent;
            callback(fs.readFileSync(distFile).toString());
          } else {
            callback(packageDirectory);
          }
        } else {
          fs.mkdirpSync(packageDirectory);
          self.logger.info("downloading " + packageName + " " + version + "....");

          utils.downloadFile(tarball, packageDirectory + "/downloaded_package.tgz", function() {
            utils.extractTar(packageDirectory + "/downloaded_package.tgz", packageDirectory, function() {
                if (returnContent) {
                  let distFile = packageDirectory + returnContent;
                  callback(fs.readFileSync(distFile).toString());
                } else {
                  callback(packageDirectory);
                }
            });
          });
        }
      }

    });
  }
}

module.exports = Npm;

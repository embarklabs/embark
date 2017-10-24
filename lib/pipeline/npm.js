// TODO: this is horrible and needs to be refactored ASAP
let utils = require('../utils/utils.js');
let fs = require('../core/fs.js');
let o_fs = require('fs-extra');

let http = require('follow-redirects').http;
let https = require('follow-redirects').https;
var tar = require('tar');

class Npm {

  constructor(options) {
    this.logger = options.logger;
  }

  // TODO: callback should accept an error
  getPackageVersion(packageName, version, returnContent, getFromGit, callback) {
    let self = this;
    let npmRegistry = "https://registry.npmjs.org/" + packageName + "/" + version;

    utils.httpsGet(npmRegistry, function (res) {

      let body = '';
      res.on('data', function (d) {
        body += d;
      });
      res.on('end', function () {
        let registryJSON = JSON.parse(body);

        let tarball = registryJSON.dist.tarball;

        var download = function(url, dest, cb) {
          var file = o_fs.createWriteStream(dest);
          var request = (url.substring(0,5) === 'https' ? https : http).get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
              file.close(cb);  // close() is async, call cb after close completes.
            });
          }).on('error', function(err) { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            if (cb) cb(err.message);
          });
        };

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

            download(fileLocation, packageDirectory + "/" + packageName + ".js", function() {
              o_fs.createReadStream(packageDirectory + "/" + packageName + ".js").pipe(
                tar.x({
                strip: 1,
                C: packageDirectory
              }).on('end', function() {
                if (returnContent) {
                  let distFile = packageDirectory + packageName + ".js";
                  callback(fs.readFileSync(distFile).toString());
                } else {
                  callback(packageDirectory);
                }
              })
              );
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

            download(tarball, packageDirectory + "/downloaded_package.tgz", function() {
              o_fs.createReadStream(packageDirectory + '/downloaded_package.tgz').pipe(
                tar.x({
                strip: 1,
                C: packageDirectory
              }).on('end', function() {
                if (returnContent) {
                  let distFile = packageDirectory + returnContent;
                  callback(fs.readFileSync(distFile).toString());
                } else {
                  callback(packageDirectory);
                }
              })
              );
            });
          }
        }

      });
    });
  }
}

module.exports = Npm;

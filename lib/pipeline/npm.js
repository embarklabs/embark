let utils = require('../utils/utils.js');

module.exports = {
  // TODO: need to refactor to make it truly generalistic, perhaps by
  // downloading the tarball itself
  getPackageVersion: function(packageName, version, callback) {
    let npmRegistry = "http://registry.npmjs.org/" + packageName + "/" + version;

    utils.httpGet(npmRegistry, function (res) {

      let body = '';
      res.on('data', function (d) {
        body += d;
      });
      res.on('end', function () {
        let registryJSON = JSON.parse(body);
        let gitHash = registryJSON.gitHead;
        let repo = registryJSON.homepage.split("github.com/")[1];

        let gitUrl = "http://raw.githubusercontent.com/" + repo + "/" + gitHash + "/dist/" + packageName + ".js";
        utils.httpGet(gitUrl, function (res2) {
          let body = '';
          res2.on('data', function (d) {
            body += d;
          });
          res2.on('end', function () {
            callback(body);
          });
        });
      });
    });
  }
};


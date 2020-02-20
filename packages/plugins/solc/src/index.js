const Compiler = require("./lib/Compiler");
const semver = require('semver');

module.exports = (embark) => {
  if (embark.config.embarkConfig.versions.solc) {
    embark.registerCompiler('.sol', (contractFiles, options, cb) => {
      if (!contractFiles || !contractFiles.length) {
        return cb();
      }
      Compiler.getSolcVersion(embark.logger, (err, version) => {
        if (err) {
          embark.logger.error(err);
          embark.logger.error("Error getting solc's version. Will default back to Embark's compiler");
          return cb(null, false);
        }
        if (semver.lt(version, embark.config.embarkConfig.versions.solc)) {
          embark.logger.warn(`Current version of solc lower than version in embark.json`);
          embark.logger.warn(`Current: ${version} | Wanted: ${embark.config.embarkConfig.versions.solc}`);
          embark.logger.warn('Will default back to Embark\'s compiler');
          return cb(null, false);
        }
        Compiler.compileSolc(embark, contractFiles, embark.config.contractDirectories, options, cb);
      });
    });

  }
};

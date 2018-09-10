let fs = require('./../../core/fs.js');
let utils = require('./../../utils/utils.js');
let async = require('async');
class PluginCommand {
  constructor(embark, config) {
    this.embark = embark;
    this.config = config;
    this.embarkConfig = fs.readJSONSync(this.config.embarkConfigFile);
    this.registerCommands();
  }
  registerCommands() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      let cmdArray = cmd.split(' ');
      cmdArray = cmdArray.filter(cmd => cmd.trim().length > 0);
      let cmdName = cmdArray[0];
      return {
        match: () =>  cmdName === 'plugin',
        process: (callback) => {
          if(cmdArray.length < 3 || cmdArray[1] !== 'install' || typeof cmdArray[2] === 'undefined') {
            return callback(__('arguments to the command are missing or invalid'));
          }
          let npmInstall = ['npm', 'install'];
          if (cmdArray[2] === '--save') {
            if(typeof cmdArray[3] === 'undefined') {
              return callback(__('npm package argument missing'));
            }
          } else {
            npmInstall.push('--save');
          }
          npmInstall = npmInstall.concat(cmdArray.slice(2));

          async.waterfall([
            function npmInstallAsync(cb) {
              utils.runCmd(npmInstall.join(' '), {silent: false, exitOnError: false}, (err) => {
                if(err) {
                  return cb(err);
                }
                cb();
              });
            },
            function addToEmbarkConfig(cb) {
              // get the installed package from package.json
              let packageFile = fs.readJSONSync(self.config.packageFile);
              let dependencies = Object.keys(packageFile.dependencies);
              let npmPackage = npmInstall[3];
              let installedPackage = dependencies.filter((dep) => npmPackage.indexOf(dep) >=0);
              self.embarkConfig.plugins[installedPackage[0]] = {};
              fs.writeFile(self.config.embarkConfigFile, JSON.stringify(self.embarkConfig, null, 2), cb);
            }
          ], (err) => {
            if(err) {
              callback(__(err));
            } else {
              callback(null, 'npm package successfully installed as a plugin');
            }
          });
        }
      };
    });
  }
}

module.exports = PluginCommand;

let fs = require('./../../core/fs.js');
let utils = require('./../../utils/utils.js');
let async = require('async');

class PluginCommand {
  constructor(embark, config) {
    this.embark = embark;
    this.config = config;
    this.embarkConfig = fs.readJSONSync(this.config.embarkConfig);
    this.registerCommands();
  }
  registerCommands() {
    this.embark.registerConsoleCommand((cmd, _options) => {
      let cmdArray = cmd.split(' ');
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
            npmInstall = npmInstall.concat(cmdArray);
          } else {
            npmInstall = npmInstall.concat(['--save'].concat(cmdArray.slice(2)));
          }

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
              //TO DO: read from package.json and update the plugins
              cb();
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

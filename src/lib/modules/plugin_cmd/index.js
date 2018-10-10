const fs = require('./../../core/fs.js');
const utils = require('./../../utils/utils.js');
const async = require('async');

class PluginCommand {
  constructor(embark) {
    this.embark = embark;
    this.config = this.embark.pluginConfig;
    this.embarkConfig = this.config.embarkConfig;
    this.registerCommand();
  }

  registerCommand() {
    this.embark.registerConsoleCommand((cmd, _options) => {
      let cmdArray = cmd.split(' ');
      cmdArray = cmdArray.filter(cmd => cmd.trim().length > 0);
      let cmdName = cmdArray[0];
      return {
        match: () => cmdName === 'plugin',
        process: this.installPlugin.bind(this, cmdArray)
      };
    });
  }

  installPlugin(cmdArray, callback) {
    const self = this;

    if (cmdArray.length < 3 || cmdArray[1] !== 'install' || typeof cmdArray[2] === 'undefined') {
      return callback(__('Invalid use of plugin command. Please use `plugin install <package>`'));
    }
    let npmInstall = ['npm', 'install', '--save'];
    npmInstall = npmInstall.concat(cmdArray.slice(2));
    let npmPackage = npmInstall[3];
    if (!npmPackage.startsWith('embark')) {
      npmPackage = 'embark-' + npmPackage;
    }
    self.embark.logger.info(__('Installing npm package %s...', npmPackage));
    async.waterfall([
      function npmInstallAsync(cb) {
        utils.runCmd(npmInstall.join(' '), {silent: false, exitOnError: false}, (err) => {
          if (err) {
            return cb(err);
          }
          cb();
        });
      },
      function addToEmbarkConfig(cb) {
        // get the installed package from package.json
        let packageFile = fs.readJSONSync(self.config.packageFile);
        let dependencies = Object.keys(packageFile.dependencies);
        let installedPackage = dependencies.filter((dep) => npmPackage.indexOf(dep) >= 0);
        self.embarkConfig.plugins[installedPackage[0]] = {};
        fs.writeFile(self.config.embarkConfigFile, JSON.stringify(self.embarkConfig, null, 2), cb);
      }
    ], (err) => {
      if (err) {
        self.embark.logger.error(__('Error installing npm package %s. Please visit ' +
          'https://embark.status.im/plugins/ for all supported plugins', npmPackage));
        return callback(__('Error occurred'));
      }
      callback(null, __('NPM package %s successfully installed as a plugin', npmPackage));
    });
  }
}

module.exports = PluginCommand;

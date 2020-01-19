import { __ } from 'embark-i18n';
const { runCmd } = require('embark-utils');
const async = require('async');

class PluginCommand {
  constructor(embark) {
    this.embark = embark;
    this.fs = embark.fs;
    this.config = this.embark.pluginConfig;
    this.embarkConfig = this.config.embarkConfig;
    this.registerCommand();
  }

  registerCommand() {
    this.embark.registerConsoleCommand({
      description: "Installs a plugin in the Dapp. eg: plugin install embark-solc",
      usage: "plugin install [package]",
      matches: (cmd) => {
        const [cmdName] = cmd.split(' ');
        return cmdName === 'plugin';
      },
      process: (cmd, callback) => {
        let cmdArray = cmd.split(' ');
        cmdArray = cmdArray.filter(cmd => cmd.trim().length > 0);
        this.installPlugin(cmdArray, callback);
      }
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
        runCmd(npmInstall.join(' '), {silent: false, exitOnError: false}, (err) => {
          if (err) {
            return cb(err);
          }
          cb();
        });
      },
      function addToEmbarkConfig(cb) {
        // get the installed package from package.json
        let packageFile = self.fs.readJSONSync(self.config.packageFile);
        let dependencies = Object.keys(packageFile.dependencies);
        let installedPackage = dependencies.filter((dep) => npmPackage.indexOf(dep) >= 0);
        self.embarkConfig.plugins[installedPackage[0]] = {};
        self.fs.writeFile(self.config.embarkConfigFile, JSON.stringify(self.embarkConfig, null, 2), cb);
      }
    ], (err) => {
      if (err) {
        self.embark.logger.error(__('Error installing npm package %s. Please visit ' +
          'https://framework.embarklabs.io/plugins/ for all supported plugins', npmPackage));
        return callback(__('Error occurred'));
      }
      callback(null, __('NPM package %s successfully installed as a plugin', npmPackage));
    });
  }
}

module.exports = PluginCommand;

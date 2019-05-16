import { dappPath, errorMessage } from 'embark-utils';
const fs = require('fs-extra');
import * as path from 'path';

class WebpackConfigReader {
  constructor(options) {
    this.webpackConfigName = options.webpackConfigName;
  }

  async readConfig(callback){
    const dappConfigPath = dappPath('webpack.config.js');
    const defaultConfigPath = path.resolve(__dirname, 'webpack.config.js');

    let config, configPath;
    try {
      if (fs.existsSync(dappConfigPath)) {
        configPath = dappConfigPath;
        delete require.cache[configPath];
      } else {
        configPath = defaultConfigPath;
      }
      config = require(configPath);
      // valid config types: https://webpack.js.org/configuration/configuration-types/
      // + function that returns a config object
      // + function that returns a promise for a config object
      // + array of named config objects
      // + config object
      if (typeof config === 'function') {
        config = await config(this.webpackConfigName);
      } else if (Array.isArray(config)) {
        config = config.filter(cfg => cfg.name === this.webpackConfigName);
        if (!config.length) {
          return callback(`no webpack config has the name '${this.webpackConfigName}'`);
        }
        if (config.length > 1) {
          console.warn(`detected ${config.length} webpack configs having the name '${this.webpackConfigName}', using the first one`);
        }
        config = config[0];
      }
      callback(null, config);
    } catch (e) {
      console.error(`error while loading webpack config ${configPath}`);
      callback(errorMessage(e));
    }
  }
}

module.exports = WebpackConfigReader;

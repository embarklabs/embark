const constants = require('../constants');
const fs = require('../core/fs');
const ProcessWrapper = require('../core/processes/processWrapper');
const webpack = require('webpack');
const writeFile = require('util').promisify(require('fs').writeFile);

let webpackProcess;

function errorMessage(e) {
  if (typeof e === 'string') {
    return e;
  } else if (e && e.message) {
    return e.message;
  } else {
    return e;
  }
}

class WebpackProcess extends ProcessWrapper {
  constructor(options) {
    super(options);
    this.webpackConfigName = options.webpackConfigName;
  }

  async build(assets, importsList, callback) {
    try {
      await this.webpackRun(assets, importsList, callback);
    } catch (e) {
      callback(errorMessage(e));
    }
  }

  async webpackRun(assets, importsList, callback) {
    try {
      await writeFile(
        fs.dappPath('.embark/embark-aliases.json'),
        JSON.stringify(importsList)
      );
      await writeFile(
        fs.dappPath('.embark/embark-assets.json'),
        JSON.stringify(assets)
      );
    } catch (e) {
      return callback(errorMessage(e));
    }

    const dappConfigPath = fs.dappPath('webpack.config.js');
    const defaultConfigPath = fs.embarkPath('lib/pipeline', 'webpack.config.js');

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
      } else {
        // proceed with the value obtained from require(configPath)
      }
    } catch (e) {
      console.error(`error while loading webpack config ${configPath}`);
      callback(errorMessage(e));
    }

    if (typeof config !== 'object' || config === null) {
      return callback('bad webpack config, the resolved config was null or not an object');
    }

    webpack(config).run(async (err, stats) => {
      if (err) {
        return callback(errorMessage(err));
      }
      try {
        if (config.stats && config.stats !== 'none') {
          this._log('info', 'writing file '+ ('.embark/stats.report').bold.dim);
          await writeFile(
            fs.dappPath('.embark/stats.report'),
            stats.toString(config.stats)
          );
          this._log('info', 'writing file ' + ('.embark/stats.json').bold.dim);
          await writeFile(
            fs.dappPath('.embark/stats.json'),
            JSON.stringify(stats.toJson(config.stats))
          );
        }
      } catch (e) {
        return callback(errorMessage(e));
      }
      if (config.stats && stats.hasErrors()) {
        const errors = stats.toJson(config.stats).errors.join('\n');
        return callback(errors);
      }
      callback();
    });
  }
}

process.on('message', (msg) => {
  if (msg.action === constants.pipeline.init) {
    webpackProcess = new WebpackProcess(msg.options);
    return process.send({result: constants.pipeline.initiated});
  }

  if (msg.action === constants.pipeline.build) {
    return webpackProcess.build(msg.assets, msg.importsList, (err) => {
      process.send({result: constants.pipeline.built, error: err});
    });
  }
});

const constants = require('../../constants');
const fs = require('../../core/fs');
const ProcessWrapper = require('../../core/processes/processWrapper');
const webpack = require('webpack');
const writeFile = require('util').promisify(require('fs').writeFile);
const {errorMessage} = require('../../utils/utils');
const WebpackConfigReader = require('./webpackConfigReader');

let webpackProcess;

class WebpackProcess extends ProcessWrapper {
  constructor(options) {
    super(options);
    this.webpackConfigName = options.webpackConfigName;
    this.pipelineConfig = options.pipelineConfig;
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
      await writeFile(
        fs.dappPath('.embark/embark-pipeline.json'),
        JSON.stringify(this.pipelineConfig)
      );
    } catch (e) {
      return callback(errorMessage(e));
    }

    const configReader = new WebpackConfigReader({webpackConfigName: this.webpackConfigName});
    configReader.readConfig((err, config) => {
      if (err) {
        return callback(err);
      }

      if (typeof config !== 'object' || config === null) {
        return callback('bad webpack config, the resolved config was null or not an object');
      }

      webpack(config).run(async (err, stats) => {
        if (err) {
          return callback(errorMessage(err));
        }
        if (!config.stats || config.stats === 'none') {
          return callback();
        }
        try {
          this._log('info', 'writing file ' + ('.embark/stats.report').bold.dim);
          await writeFile(
            fs.dappPath('.embark/stats.report'),
            stats.toString(config.stats)
          );
          this._log('info', 'writing file ' + ('.embark/stats.json').bold.dim);
          await writeFile(
            fs.dappPath('.embark/stats.json'),
            JSON.stringify(stats.toJson(config.stats))
          );
          if (stats.hasErrors()) {
            const errors = stats.toJson(config.stats).errors.join('\n');
            return callback(errors);
          }
          callback();
        } catch (e) {
          return callback(errorMessage(e));
        }
      });
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

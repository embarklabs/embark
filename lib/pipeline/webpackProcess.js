const async = require('async');
const webpack = require('webpack');
const utils = require('../utils/utils');
const fs = require('../core/fs');
const constants = require('../constants');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const ProcessWrapper = require('../process/processWrapper');
const path = require('path');

let webpackProcess;

class WebpackProcess extends ProcessWrapper {
  build(file, importsList, callback) {
    const self = this;
    let realCwd;

    async.waterfall([
      function changeCwd(next) {
        realCwd = utils.pwd();
        process.chdir(fs.embarkPath(''));
        next();
      },

      function runWebpack(next) {
        self.webpackRun(file.filename, {}, true, importsList, true, realCwd, next);
      },

      function changeCwdBack(next) {
        process.chdir(realCwd);
        next();
      }
    ], (err) => {
      process.chdir(realCwd);
      callback(err);
    });
  }

  webpackRun(filename, options, includeModules, importsList, detectErrors, realCwd, callback) {
    let defaultOptions = {
      entry: fs.dappPath(filename),
      output: {
        libraryTarget: 'umd',
        path: fs.dappPath('.embark'),
        filename: filename
      },
      resolve: {
        alias: importsList,
        modules: [
          fs.embarkPath('node_modules'),
          fs.dappPath('node_modules')
        ]
      },
      plugins: [
        new HardSourceWebpackPlugin({
          cacheDirectory: fs.dappPath('node_modules/.cache/hard-source'),
          // ufglify would still be saving under embark's node_modules/.cache
          environmentHash: {
            root: fs.dappPath()
          }
        }),
        new HardSourceWebpackPlugin.ExcludeModulePlugin([{
          test: /app[\\/]|contracts[\\/]/
        }])
      ]
    };

    let webpackOptions = utils.recursiveMerge(defaultOptions, options);

    if (includeModules) {
      webpackOptions.module = {
        rules: [
          {
            test: /\.css$/,
            use: [{loader: "style-loader"}, {loader: "css-loader"}]
          },
          {
            test: /\.scss$/,
            use: [{loader: "style-loader"}, {loader: "css-loader"}]
          },
          {
            test: /\.(png|woff|woff2|eot|ttf|svg)$/,
            loader: 'url-loader?limit=100000'
          },
          {
            test: /\.js$/,
            loader: "babel-loader",
            exclude: /(node_modules|bower_components)/,
            options: {
              extends: path.join(realCwd, '.babelrc'),
              presets: ['babel-preset-es2016', 'babel-preset-es2017', 'babel-preset-react'].map(require.resolve),
              plugins: ["babel-plugin-webpack-aliases"].map(require.resolve),
              compact: false
            }
          }
        ]
      };
    }

      }

    webpack(webpackOptions).run((err, stats) => {
      async.waterfall([
        function checkStatsError(next) {
          if (err) {
            console.error(err);
            return next(err);
          }
          if (!detectErrors) {
            return next();
          }
          if (stats.hasErrors()) {
            return next(
              stats.toJson(webpackOptions.stats).errors.join("\n")
            );
          }
          next();
        },
        function writeStatsReport(next) {
          if (detectErrors) {
            self._log('info', 'writing file '+ ('dist/stats.report').bold.dim);
          }
          fs.writeFile(
            path.join(fs.dappPath('.embark'), 'stats.report'),
            stats.toString(webpackOptions.stats),
            next
          );
        },
        function writeStatsJSON(next) {
          if (detectErrors) {
            self._log('info','writing file '+ ('dist/stats.json').bold.dim);
          }
          fs.writeFile(
            path.join(fs.dappPath('.embark'), 'stats.json'),
            JSON.stringify(stats.toJson(webpackOptions.stats)),
            next
          );
        }
      ], (err) => {
        callback(err);
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
    return webpackProcess.build(msg.file, msg.importsList, (err) => {
      process.send({result: constants.pipeline.built, error: err});
    });
  }
});

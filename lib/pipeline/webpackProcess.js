const async = require('async');
const webpack = require('webpack');
const utils = require('../utils/utils');
const fs = require('../core/fs');
const constants = require('../constants');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const path = require('path');

let webpackProcess;

class WebpackProcess extends ProcessWrapper {
  constructor(options) {
    super(options);
    this.env = options.env;
  }

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
    const self = this;
    let defaultOptions = {
      mode: self.env === 'production' ? 'production' : 'none',
      // devtool: self.env === 'development' ? 'source-map' : false,
      // pipeline would need to copy .map files to dist/ target dir
      // note: generating full source maps ('source-map') roughly doubles build time
      entry: fs.dappPath(filename),
      output: {
        globalObject: 'typeof self !== \'undefined\' ? self : this',
        libraryExport: 'default',
        libraryTarget: 'umd',
        path: fs.dappPath('.embark'),
        filename: filename,
        umdNamedDefine: true
      },
      // profile: true,
      // stats: 'verbose',
      // note: generating and writing to disk verbose stats increases build time
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
          // ufglify (wp mode: production) will still save its cache in embark's node_modules/.cache/
          environmentHash: {
            root: fs.dappPath()
          }
        }),
        new HardSourceWebpackPlugin.ExcludeModulePlugin(
          [{test: /app[\\/]|contracts[\\/]/}]
        )
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
              presets: [
                [
                  "@babel/preset-env", {
                    modules: false,
                    targets: {
                      browsers: ["last 1 version", "not dead", "> 0.2%"]
                    }
                  }
                ],
                "@babel/preset-react"
              ].map(pkg => {
                if (Array.isArray(pkg)) {
                  let _pkg = pkg[0];
                  pkg[0] = require.resolve(_pkg);
                  return pkg;
                } else {
                  return require.resolve(pkg);
                }
              }),
              plugins: [
                "@babel/plugin-transform-runtime",
                "babel-plugin-webpack-aliases"
              ].map(require.resolve),
              compact: false
            }
          }
        ]
      };

      let dappBabelrc = path.join(realCwd, '.babelrc');
      if (fs.existsSync(dappBabelrc)) {
        webpackOptions.module.rules[3].options.extends = dappBabelrc;
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
        }//,
        // function writeStatsReport(next) {
        //   if (detectErrors) {
        //     self._log('info', 'writing file '+ ('.embark/stats.report').bold.dim);
        //   }
        //   fs.writeFile(
        //     path.join(fs.dappPath('.embark'), 'stats.report'),
        //     stats.toString(webpackOptions.stats),
        //     next
        //   );
        // },
        // function writeStatsJSON(next) {
        //   if (detectErrors) {
        //     self._log('info','writing file '+ ('.embark/stats.json').bold.dim);
        //   }
        //   fs.writeFile(
        //     path.join(fs.dappPath('.embark'), 'stats.json'),
        //     JSON.stringify(stats.toJson(webpackOptions.stats)),
        //     next
        //   );
        // }
        // note: to visualize the stats info in a browser, do...
        // `npx webpack-bundle-analyzer <dapp_dir>/.embark/stats.json`
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

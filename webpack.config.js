/* global module process require */

// NOTE: some packages, plugins, and presets referenced/required in this webpack
// config are deps of embark and will be transitive dapp deps unless specified
// in the dapp's own package.json, perhaps with a different version/range or
// other specifier

// NOTE: embark modifies process.env.NODE_PATH so that embark's own
// node_modules directory will be searched by node's require(). That allows an
// ejected version of this config, inside a dapp, to function correctly without
// embark being an explicit dependency of the dapp.  However, webpack and babel
// do not directly support NODE_PATH, so in various parts of the config,
// modules such as plugins and presets must be resolved with
// require.resolve(). That is only necessary if a plugin/preset is in embark's
// node_modules; if it's in the dapp's node_modules then it can be specified
// directly

// there's a bug in pkg clone-deep re: regex; for now use lodash.clonedeep
// see: https://github.com/jonschlinkert/clone-deep/pull/14
const cloneDeep = require('lodash.clonedeep');
const CompressionPlugin = require('compression-webpack-plugin');
const fs = require('fs');
const glob = require('glob');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const path = require('path');

const dappPath = process.env.DAPP_PATH;
const embarkPath = process.env.EMBARK_PATH;

const embarkAliases = require(path.join(dappPath, '.embark/embark-aliases.json'));
const embarkAssets = require(path.join(dappPath, '.embark/embark-assets.json'));
const embarkJson = require(path.join(dappPath, 'embark.json'));

// it's important to `embark reset` if a pkg version is specified in
// embark.json and changed/removed later, otherwise pkg resolution may behave
// unexpectedly, e.g. a different version may get used owing to lexographical
// order or because .embark/versions is still in place even though defaults are
// desired; once embark and its dependencies are always resolvable (in the
// usual node sense) relative to a dapp, embark's pkg version-management
// functionality can probably be deprecated in favor of a dapp simply
// specifying dependencies in its own package.json, e.g. a different ipfs
// version than embark's default
let versions;
try {
  versions = glob.sync(path.join(dappPath, '.embark/versions/*/*'));
} catch (e) {
  versions = [];
}

const entry = Object.keys(embarkAssets)
      .filter(key => key.match(/\.js?$/))
      .reduce((obj, key) => {
        obj[key] = embarkAssets[key]
          .map(file => {
            let file_path = file.path;
            if (!file.path.match(/^\.\//)) {
              file_path = './' + file_path;
            }
            return file_path;
          });
        return obj;
      }, {});

// base config
// -----------------------------------------------------------------------------

const base = {
  context: dappPath,
  entry: entry,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{loader: 'style-loader'}, {loader: 'css-loader'}]
      },
      {
        test: /\.scss$/,
        use: [{loader: 'style-loader'}, {loader: 'css-loader'}]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components|\.embark[\\/]versions)/,
        options: {
          plugins: [
            [
              require.resolve('babel-plugin-module-resolver'), {
                'alias': embarkAliases
              }
            ],
            [
              require.resolve('@babel/plugin-transform-runtime'), {
                corejs: 2,
                useESModules: true
              }
            ]
          ],
          presets: [
            [
              require.resolve('@babel/preset-env'), {
                modules: false,
                targets: {
                  browsers: ['last 1 version', 'not dead', '> 0.2%']
                }
              }
            ],
            require.resolve('@babel/preset-react')
          ]
        }
      }
    ]
  },
  output: {
    filename: (chunkData) => chunkData.chunk.name,
    // globalObject workaround for node-compatible UMD builds with webpack 4
    // see: https://github.com/webpack/webpack/issues/6522#issuecomment-371120689
    globalObject: 'typeof self !== \'undefined\' ? self : this',
    libraryTarget: 'umd',
    path: path.join(dappPath, '.embark')
  },
  plugins: [
    new HardSourceWebpackPlugin()
  ],
  // profiling and generating verbose stats increases build time; if stats
  // are generated embark will write the output to:
  //   path.join(dappPath, '.embark/stats.[json,report]')
  // to visualize the stats info in a browser run:
  //   npx webpack-bundle-analyzer <dappPath>/.embark/stats.json
  profile: true, stats: 'verbose',
  resolve: {
    alias: embarkAliases,
    modules: [
      ...versions,
      'node_modules',
      path.join(embarkPath, 'node_modules')
    ]
  },
  resolveLoader: {
    modules: [
      'node_modules',
      path.join(embarkPath, 'node_modules')
    ],
  }
};

// development config
// -----------------------------------------------------------------------------

const development = cloneDeep(base);
// full source maps increase build time but are useful during dapp development
// HOWEVER: source maps are broken (completely? not sure) until a webpack
// chunk corresponds to a file being written to buildDir per embark.json;
// currently embark is concatenating webpack chunks
// dev.devtool = 'source-map';
development.mode = 'development';
// alternative: development.mode = 'none';
development.name = 'development';
const devBabelLoader = development.module.rules[3];
devBabelLoader.options.compact = false;

// production config
// -----------------------------------------------------------------------------

const production = cloneDeep(base);
production.mode = 'production';
production.name = 'production';
production.plugins.push(new CompressionPlugin());

// export a list of named configs
// -----------------------------------------------------------------------------

module.exports = [
  development,
  production
];

// some packages, plugins, and presets referenced/required in this webpack
// config are deps of embark and will be transitive dapp deps unless specified
// in the dapp's own package.json

// embark modifies process.env.NODE_PATH so that when running dapp scripts in
// embark's child processes, embark's own node_modules directory will be
// searched by node's require(); however, webpack and babel do not directly
// support NODE_PATH, so modules such as babel plugins and presets must be
// resolved with require.resolve(); that is only necessary if a plugin/preset
// is in embark's node_modules vs. the dapp's node_modules

const cloneDeep = require('lodash.clonedeep');
// const CompressionPlugin = require('compression-webpack-plugin');
const glob = require('glob');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const path = require('path');

const dappPath = process.env.DAPP_PATH;
const embarkPath = process.env.EMBARK_PATH;

const embarkAliases = require(path.join(dappPath, '.embark/embark-aliases.json'));
const embarkAssets = require(path.join(dappPath, '.embark/embark-assets.json'));
const embarkNodeModules = path.join(embarkPath, 'node_modules');
const embarkJson = require(path.join(dappPath, 'embark.json'));

const buildDir = path.join(dappPath, embarkJson.buildDir);

// it's important to `embark reset` if a pkg version is specified in
// embark.json and changed/removed later, otherwise pkg resolution may behave
// unexpectedly
let versions;
try {
  versions = glob.sync(path.join(dappPath, '.embark/versions/*/*'));
} catch (e) {
  versions = [];
}

const entry = Object.keys(embarkAssets)
  .filter(key => key.match(/\.js$/))
  .reduce((obj, key) => {
    // webpack entry paths should start with './' if they're relative to the
    // webpack context; embark.json "app" keys correspond to lists of .js
    // source paths relative to the top-level dapp dir and may be missing the
    // leading './'
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

function resolve(pkgName) {
  if (Array.isArray(pkgName)) {
    const _pkgName = pkgName[0];
    pkgName[0] = require.resolve(_pkgName);
    return pkgName;
  }
  return require.resolve(pkgName);
}

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
        test: /\.(js|jsx|tsx|ts)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components|\.embark[\\/]versions)/,
        options: {
          plugins: [
            [
              'babel-plugin-module-resolver', {
                'alias': embarkAliases
              }
            ],
            [
              '@babel/plugin-transform-runtime', {
                corejs: 2,
                useESModules: true
              }
            ]
          ].map(resolve),
          presets: [
            [
              '@babel/preset-env', {
                modules: false,
                targets: {
                  browsers: ['last 1 version', 'not dead', '> 0.2%']
                }
              }
            ],
            '@babel/preset-react',
            '@babel/preset-typescript'
          ].map(resolve)
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
    path: buildDir
  },
  plugins: [new HardSourceWebpackPlugin()],
  // profiling and generating verbose stats increases build time; if stats
  // are generated embark will write the output to:
  //   path.join(dappPath, '.embark/stats.[json,report]')
  // to visualize the stats info in a browser run:
  //   npx webpack-bundle-analyzer .embark/stats.json <buildDir>
  profile: true, stats: 'verbose',
  resolve: {
    alias: embarkAliases,
    modules: [
      ...versions,
      'node_modules',
      embarkNodeModules
    ]
  },
  resolveLoader: {
    modules: [
      'node_modules',
      embarkNodeModules
    ]
  }
};

// development config
// -----------------------------------------------------------------------------

const development = cloneDeep(base);
// full source maps increase build time but are useful during dapp development
development.devtool = 'source-map';
development.mode = 'development';
// alternatively:
// development.mode = 'none';
development.name = 'development';
const devBabelLoader = development.module.rules[3];
devBabelLoader.options.compact = false;

// production config
// -----------------------------------------------------------------------------

const production = cloneDeep(base);
production.mode = 'production';
production.name = 'production';
// compression of webpack's JS output not enabled by default
// production.plugins.push(new CompressionPlugin());

// export a list of named configs
// -----------------------------------------------------------------------------

module.exports = [
  development,
  production
];

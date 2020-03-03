const fs = require('fs');
const path = require('path');

const dappPath = process.env.DAPP_PATH;
const embarkBasicPipelinePath = process.env.EMBARK_BASIC_PIPELINE_PATH;
const embarkPath = process.env.EMBARK_PATH;

const dappNodeModules = path.join(dappPath, 'node_modules');
const embarkBasicPipelineNodeModules = path.join(embarkBasicPipelinePath, 'node_modules');
const embarkNodeModules = path.join(embarkPath, 'node_modules');
let nodePathNodeModules;
if (process.env.NODE_PATH) {
  nodePathNodeModules = process.env.NODE_PATH.split(path.delimiter);
} else {
  nodePathNodeModules = [];
}
if (fs.existsSync(embarkNodeModules) &&
    !nodePathNodeModules.includes(embarkNodeModules)) {
  nodePathNodeModules.unshift(embarkNodeModules);
}
if (fs.existsSync(embarkBasicPipelineNodeModules) &&
    !nodePathNodeModules.includes(embarkBasicPipelineNodeModules)) {
  nodePathNodeModules.unshift(embarkBasicPipelineNodeModules);
}

function requireFromEmbark(mod) {
  return require(requireFromEmbark.resolve(mod));
}

(function () {
  const paths = [];
  if (fs.existsSync(embarkNodeModules)) {
    paths.unshift(embarkNodeModules);
  }
  if (fs.existsSync(embarkBasicPipelineNodeModules)) {
    paths.unshift(embarkBasicPipelineNodeModules);
  }

  const opts = {};
  if (paths.length) {
    opts.paths = paths;
  }

  requireFromEmbark.resolve = function (mod) {
    return require.resolve(mod, opts);
  };
}());

const cloneDeep = requireFromEmbark('lodash.clonedeep');
const glob = requireFromEmbark('glob');
const HardSourceWebpackPlugin = requireFromEmbark('hard-source-webpack-plugin');

const embarkAliases = require(path.join(dappPath, '.embark/embark-aliases.json'));
const embarkAssets = require(path.join(dappPath, '.embark/embark-assets.json'));
let embarkJson;
try {
  embarkJson = require(path.join(dappPath, '.embark', 'embark.json'));
} catch (e) {
  throw new Error(`embark.json not found in ${path.join(dappPath, '.embark')}/`);
}

const embarkPipeline = require(path.join(dappPath, '.embark/embark-pipeline.json'));

const buildDir = path.join(dappPath, embarkJson.buildDir);

// it's important to `embark reset` if a pkg version is specified in
// embark.json and changed/removed later, otherwise pkg resolution may behave
// unexpectedly
let versions;
try {
  versions = glob.sync(path.join(dappPath, '.embark/versions/*/*/*'));
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
    pkgName[0] = requireFromEmbark.resolve(_pkgName);
    return pkgName;
  }
  return requireFromEmbark.resolve(pkgName);
}

// base config
// -----------------------------------------------------------------------------

// order and options of babel plugins and presets adapted from babel-preset-react-app:
// see: https://github.com/facebook/create-react-app/tree/v2.0.4/packages/babel-preset-react-app
// + babel plugins run before babel presets.
// + babel plugin ordering is first to last.
// + babel preset ordering is reversed (last to first).
// see: https://babeljs.io/docs/en/plugins#plugin-ordering

const base = {
  context: dappPath,
  entry: entry,
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
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
          cacheDirectory: true,
          cacheCompression: false,
          customize: path.join(__dirname, 'babel-loader-overrides.js'),
          plugins: [
            [
              'babel-plugin-module-resolver', {
                alias: embarkAliases
              }
            ],
            'babel-plugin-macros',
            '@babel/plugin-transform-destructuring',
            [
              '@babel/plugin-proposal-decorators', {
                legacy: true
              }
            ],
            [
              '@babel/plugin-proposal-class-properties', {
                loose: true
              }
            ],
            [
              '@babel/plugin-proposal-object-rest-spread', {
                useBuiltIns: true
              }
            ],
            [
              '@babel/plugin-transform-runtime', {
                corejs: 3,
                useESModules: true
              }
            ],
            '@babel/plugin-syntax-dynamic-import'
          ].map(resolve),
          presets: [
            [
              '@babel/preset-env', {
                corejs: 3,
                exclude: ['transform-typeof-symbol'],
                modules: false,
                shippedProposals: true,
                targets: {
                  browsers: ['last 1 version', 'not dead', '> 0.2%']
                },
                useBuiltIns: 'usage'
              }
            ],
            [
              '@babel/preset-react', {
                useBuiltIns: true
              }
            ]
          ].map(resolve)
        }
      }
    ]
  },
  output: {
    filename: (chunkData) => chunkData.chunk.name,
    // globalObject workaround for node-compatible UMD builds with webpack 4
    // see: https://github.com/webpack/webpack/issues/6522#issuecomment-371120689
    // see: https://github.com/webpack/webpack/issues/6522#issuecomment-418864518
    globalObject: '(typeof self !== \'undefined\' ? self : this)',
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
    extensions: [
      // webpack defaults
      // see: https://webpack.js.org/configuration/resolve/#resolve-extensions
      '.wasm', '.mjs', '.js', '.json',
      // additional extensions
      '.jsx'
    ],
    modules: [
      ...versions,
      'node_modules',
      dappNodeModules,
      ...nodePathNodeModules
    ]
  },
  resolveLoader: {
    modules: [
      'node_modules',
      dappNodeModules,
      ...nodePathNodeModules
    ]
  }
};

const baseBabelLoader = base.module.rules[3];

// Flow
// -----------------------------------------------------------------------------

// should be false in configs that have isTypeScriptEnabled = true
const isFlowEnabled = !embarkPipeline.typescript;
if (isFlowEnabled) {
  // position @babel/plugin-transform-flow-strip-types per babel-preset-react-app
  baseBabelLoader.options.plugins.unshift(
    requireFromEmbark.resolve('@babel/plugin-transform-flow-strip-types')
  );
}

// TypeScript
// -----------------------------------------------------------------------------

// should be false in configs that have isFlowEnabled = true
const isTypeScriptEnabled = !!embarkPipeline.typescript;
if (isTypeScriptEnabled) {
  // position @babel/preset-typescript as the last preset (runs first)
  // see: https://blogs.msdn.microsoft.com/typescript/2018/08/27/typescript-and-babel-7/
  baseBabelLoader.options.presets.push(
    requireFromEmbark.resolve('@babel/preset-typescript')
  );
  // additional extensions
  baseBabelLoader.test = /\.(js|ts)x?$/;
  base.resolve.extensions.push('.ts', '.tsx');
}

if (isFlowEnabled && isTypeScriptEnabled) {
  throw new Error('isFlowEnabled and isTypeScriptEnabled cannot both be true');
}

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
// enable 'development' option for @babel/preset-react
const devPresetReact = devBabelLoader.options.presets[1];
const devPresetReactOptions = devPresetReact[1];
devPresetReactOptions.development = true;

// production config
// -----------------------------------------------------------------------------

const production = cloneDeep(base);
production.mode = 'production';
production.name = 'production';
const prodBabelLoader = production.module.rules[3];
// position babel-plugin-transform-react-remove-prop-types per babel-preset-react-app
prodBabelLoader.options.plugins.splice(prodBabelLoader.length - 1, 0, [
  requireFromEmbark.resolve('babel-plugin-transform-react-remove-prop-types'),
  {
    removeImport: true
  }
]);

// export a list of named configs
// -----------------------------------------------------------------------------

module.exports = [
  development,
  production
];

/* global module */

module.exports = function (api) {
  const node = {
    ignore: [
      'src/lib/modules/pipeline/babel-loader-overrides.js',
      'src/lib/modules/pipeline/webpack.config.js'
    ],
    plugins: [
      'babel-plugin-macros',
      [
        '@babel/plugin-proposal-decorators', {
          legacy: true
        }
      ],
      '@babel/plugin-syntax-dynamic-import',
      'babel-plugin-dynamic-import-node',
      [
        '@babel/plugin-proposal-class-properties', {
          loose: true
        }
      ],
      '@babel/plugin-proposal-optional-chaining',
      [
        '@babel/plugin-transform-runtime', {
          corejs: 2
        }
      ]
    ],
    presets: [
      [
        '@babel/preset-env', {
          targets: {
            node: '8.11.3'
          }
        }
      ],
      '@babel/preset-typescript'
    ]
  };

  switch (api.env()) {
    case 'node':
      return node;
    default:
      throw new Error(`invalid babel env: ${api.env}`);
  }
};

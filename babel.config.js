/* global module require */

const cloneDeep = require('lodash.clonedeep');

module.exports = (api) => {
  const env = api.env();

  const base = {
    babelrcRoots: [
      '.',
      'packages/*'
    ],
    plugins: [
      'babel-plugin-macros',
      ['@babel/plugin-proposal-decorators', {
        legacy: true
      }],
      '@babel/plugin-syntax-dynamic-import',
      ['@babel/plugin-proposal-class-properties', {
        loose: true
      }],
      '@babel/plugin-proposal-optional-chaining',
      ['@babel/plugin-transform-runtime', {
        corejs: 2
      }]
    ],
    presets: [
      '@babel/preset-env',
      '@babel/preset-typescript'
    ]
  };

  if (env === 'base' || env.startsWith('base:')) {
    return base;
  }

  const browser = cloneDeep(base);
  browser.plugins[browser.plugins.length - 1][1].useESModules = true;
  browser.presets[0] = [browser.presets[0], {
    modules: false,
    targets: {browsers: ['last 1 version', 'not dead', '> 0.2%']}
  }];

  if (env === 'browser' || env.startsWith('browser:')) {
    return browser;
  }

  const node = cloneDeep(base);
  node.plugins.splice(
    node.plugins.indexOf('@babel/plugin-syntax-dynamic-import') + 1,
    0,
    'babel-plugin-dynamic-import-node'
  );
  node.presets[0] = [node.presets[0], {
    targets: {node: '8.11.3'}
  }];

  if (env === 'node' || env.startsWith('node:')) {
    return node;
  }

  const test = cloneDeep(node);

  if (env === 'test') {
    return test;
  }

  return {};
};

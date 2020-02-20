/*
 * dependencies of this config should be specified in `./package.json` relative
 * to this config file (which should be in the root of the monorepo);
 * yarn-workspace hoisting re: dev/Deps specified in
 * `packages/utils/collective/package.json` is not reliable re: dependencies of
 * this root-level config being resolvable (with correct versions) from the
 * monorepo root
 */

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
      [
        '@babel/plugin-proposal-decorators', {
          legacy: true
        }
      ],
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-syntax-dynamic-import',
      [
        '@babel/plugin-proposal-class-properties', {
          loose: true
        }
      ],
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      [
        '@babel/plugin-transform-runtime', {
          corejs: 3
        }
      ]
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
  browser.presets[0] = [
    browser.presets[0], {
      corejs: 3,
      modules: false,
      shippedProposals: true,
      targets: {browsers: ['last 1 version', 'not dead', '> 0.2%']},
      useBuiltIns: 'usage'
    }
  ];

  if (env === 'browser' || env.startsWith('browser:')) {
    return browser;
  }

  const node = cloneDeep(base);
  node.plugins.splice(
    node.plugins.indexOf('@babel/plugin-syntax-dynamic-import') + 1,
    0,
    'babel-plugin-dynamic-import-node'
  );
  node.presets[0] = [
    node.presets[0], {
      corejs: 3,
      shippedProposals: true,
      targets: {node: '10.17.0'},
      useBuiltIns: 'usage'
    }
  ];

  if (env === 'node' || env.startsWith('node:')) {
    return node;
  }

  const test = cloneDeep(node);

  if (env === 'test') {
    return test;
  }

  return {};
};

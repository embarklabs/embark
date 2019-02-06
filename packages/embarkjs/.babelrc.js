/* global module require */

const cloneDeep = require('lodash.clonedeep');

module.exports = (api) => {
  const env = api.env();

  const base = {};

  const browser = cloneDeep(base);
  Object.assign(browser, {
    ignore: [
      'src/embark.js',
      'src/node/async.js',
      'src/node/index.js'
    ]
  });

  const node = cloneDeep(base);
  Object.assign(node, {
    ignore: [
      'src/async.js',
      'src/browser.js',
      'src/node/async.js'
    ]
  });

  const nodeAsync = cloneDeep(base);
  Object.assign(nodeAsync, {
    ignore: [
      'src/node/index.js'
    ]
  });

  const nodeTest = cloneDeep(base);

  switch (env) {
    case 'browser':
      return browser;
    case 'node':
      return node;
    case 'node:async':
      return nodeAsync;
    case 'node:test':
      return nodeTest;
    default:
      return base;
  }
};

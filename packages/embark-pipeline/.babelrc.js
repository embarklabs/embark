/* global module require */

const cloneDeep = require('lodash.clonedeep');

module.exports = (api) => {
  const env = api.env();

  const base = {};

  const node = cloneDeep(base);
  Object.assign(node, {
    ignore: [
      'src/babel-loader-overrides.js',
      'src/webpack.config.js'
    ]
  });

  if (env === 'node') {
    return node;
  }

  return base;
};

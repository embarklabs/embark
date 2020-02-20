const cloneDeep = require('lodash.clonedeep');

module.exports = (api) => {
  const env = api.env();

  const base = {};

  const browser = cloneDeep(base);
  Object.assign(browser, {
    ignore: [
      'src/lib/async.js',
      'src/lib/node',
      'src/test'
    ]
  });

  const node = cloneDeep(base);
  Object.assign(node, {
    ignore: ['src/lib/browser']
  });

  const test = cloneDeep(node);

  switch (env) {
    case 'browser':
      return browser;
    case 'node':
      return node;
    case 'test':
      return test;
    default:
      return base;
  }
};

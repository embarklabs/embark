const cloneDeep = require('lodash.clonedeep');

module.exports = (api) => {
  const env = api.env();

  const base = {};

  const browser = cloneDeep(base);
  Object.assign(browser, {
    ignore: ['src/node']
  });

  const node = cloneDeep(base);

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

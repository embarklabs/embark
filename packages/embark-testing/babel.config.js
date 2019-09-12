const cloneDeep = require('lodash.clonedeep');

module.exports = api => {
  const env = api.env();

  const base = {
    plugins: [
      '@babel/plugin-proposal-class-properties',
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: 2
        }
      ]
    ],
    presets: ['@babel/preset-env']
  };

  if (env === 'base' || env.startsWith('base:')) {
    return base;
  }

  const node = cloneDeep(base);
  node.presets[0] = [
    node.presets[0],
    {
      targets: { node: '8.11.3' }
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

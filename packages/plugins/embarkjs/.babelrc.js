/* global __dirname module require */

const cloneDeep = require('lodash.clonedeep');
const {copySync, ensureDirSync} = require('fs-extra');
const glob = require('glob');
const {dirname, join, relative} = require('path');

// @babel/cli v7's --copy-files option does not work well together with
// config-specified ignore paths, and that's a problem for embark-collective
// actions since the @babel/cli invocation must be the same across all packages
// in the collective; so any package in the collective that excludes src/ files
// from transpilation via its package-local .babelrc.js should copy those files
// into dist/, but only if they are expected to be in dist/; .babelrc.js should
// also copy any non .js,.ts files into /dist

// in this case we want the un-transpiled webpack config and babel-loader
// overrides script from the basic-pipeline to be copied into the respective
// subdir in dist/; we also want to copy .ejs and .json files

function copyFiles (ignored) {
  const others = glob.sync(
    join(__dirname, 'src/**/*.*'),
    {ignore: [
      join(__dirname, 'src/**/*.js'),
      join(__dirname, 'src/**/*.ts'),
      join(__dirname, 'src/**/*.disabled')
    ]}
  ).map(path => relative(__dirname, path));

  ignored = ignored.concat(others);
  ignored
    .map(path => path.replace('src', 'dist'))
    .forEach((dest, index) => {
      ensureDirSync(dirname(join(__dirname, dest)));
      const source = ignored[index];
      copySync(join(__dirname, source), join(__dirname, dest));
  });
}

module.exports = (api) => {
  const env = api.env();

  const base = {};

  const node = cloneDeep(base);

  if (env === 'node') {
    copyFiles(node.ignore || []);
    return node;
  }

  const test = cloneDeep(node);

  if (env === 'test') {
    copyFiles(test.ignore || []);
    return test;
  }

  return base;
};

/* global exports process require */

const {join} = require('path');
const {promisify} = require('util');
const rimraf = promisify(require('rimraf'));

const dappPath = process.env.DAPP_PATH || process.cwd();

const green = (text) => '\x1b[32m' + text + '\x1b[0m';

exports.paths = new Set([
  '.embark',
  'chains.json',
  'coverage',
  'dist',
  'embarkArtifacts',
  'node_modules/.cache'
]);

exports.reset = async ({
  doneMessage = green('reset done!'),
  removePaths = exports.paths
} = {}) => {
  await Promise.all(
    [...removePaths].map(relative => rimraf(join(dappPath, relative)))
  );
  console.log(doneMessage);
};

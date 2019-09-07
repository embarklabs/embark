/* global exports process require */

const {join} = require('path');
const {promisify} = require('util');
const rimraf = promisify(require('rimraf'));

const dappPath = process.env.DAPP_PATH || process.cwd();

const green = (text) => '\x1b[32m' + text + '\x1b[0m';

const removePaths = new Set([
  '.embark',
  'chains.json',
  'coverage',
  'dist',
  'embarkArtifacts',
  'node_modules/.cache'
]);

async function reset() {
  const completePaths = [...removePaths].map(relative => join(dappPath, relative));

  console.log(green('Removing the following files:\n'));
  completePaths.forEach(path => console.log(`${path}`));
  await Promise.all(
    completePaths.map(path => rimraf(path))
  );
  let doneMessage = green('Done!');
  console.log(`\n${doneMessage}`);
};

module.exports = {
  paths: removePaths,
  reset
};

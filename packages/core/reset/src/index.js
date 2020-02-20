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
  doneMessage = green('Done!'),
  removePaths = exports.paths
} = {}) => {
  const completePaths = [...removePaths].map(relative => join(dappPath, relative));

  console.log(green('Removing the following files:\n'));
  completePaths.forEach(path => console.log(`${path}`));
  await Promise.all(
    completePaths.map(path => rimraf(path))
  );
  console.log(`\n${doneMessage}`);
};

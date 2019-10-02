/* global __dirname module process require */

const {spawn} = require('child_process');
const {sync: findUp} = require('find-up');
const {readJsonSync, realpathSync} = require('fs-extra');
const {join} = require('path');

module.exports = function (cliArgs) {
  process.env.EMBARK_SOLO='t';

  const pkgName = readJsonSync(findUp('package.json')).name;

  const options = {
    scope: pkgName
  };

  process.env.EMBARK_COLLECTIVE_OPTIONS = JSON.stringify(options);

  const embarkCollectivePath = realpathSync(findUp(
    'node_modules/embark-collective', {cwd: __dirname, type: 'directory'}
  ));

  const embarkCollectivePkgJson = readJsonSync(
    join(embarkCollectivePath, 'package.json')
  );

  const npxCmd = process.platform === 'win32' ? 'npx.cmd': 'npx';
  process.chdir(embarkCollectivePath);
  spawn(npxCmd, ['run', '--', ...cliArgs], {stdio: 'inherit'});
};

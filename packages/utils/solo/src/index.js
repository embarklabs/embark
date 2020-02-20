const {spawn} = require('child_process');
const {sync: findUp} = require('find-up');
const {readJsonSync, realpathSync} = require('fs-extra');

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

  const npmCmd = process.platform === 'win32' ? 'npm.cmd': 'npm';
  const subp = spawn(npmCmd, [
    'run',
    '--',
    ...cliArgs
  ], {
    cwd: embarkCollectivePath,
    stdio: 'inherit'
  });

  subp.on('close', code => process.exit(code));
};

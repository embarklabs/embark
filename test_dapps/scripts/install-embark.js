/* global __dirname process require */

const {execSync} = require('child_process');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

try {
  const {version} = require('../../lerna.json');
  const tarballs = glob.sync(
    path.join(__dirname, `../../packages/*/*-${version}.tgz`)
  );
  if (!tarballs.length) throw new Error();
  const workDir = path.join(__dirname, '../.embark/packaged');
  fs.mkdirpSync(workDir);
  const setup = `npm init -y`;
  execSync(setup, {cwd: workDir});
  const install = `npm install ${tarballs.join(' ')}`;
  console.log(`${install}\n`);
  execSync(install, {cwd: workDir, stdio: 'inherit'});
} catch (e) {
  process.exit(1);
}

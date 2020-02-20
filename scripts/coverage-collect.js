const fs = require('fs-extra');
const {execSync} = require('child_process');
const path = require('path');
const rimraf = require('util').promisify(require('rimraf'));

const collector = path.join(__dirname, './coverage-collector.js');
const destination = path.join(__dirname, '../.nyc_output');
const cmd = `npx lerna exec --parallel node "${collector}" "${destination}"`;

(async () => {
  await fs.mkdirp(destination);
  await rimraf(path.join(destination, '*'));
  execSync(cmd, {stdio: 'inherit'});
})();

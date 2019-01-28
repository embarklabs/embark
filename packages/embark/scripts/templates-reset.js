/* global __dirname process require */

const {execSync} = require('child_process');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

try {
  const templates = glob.sync(path.join(__dirname, '../templates/*'));
  const dirs = templates.filter(match => fs.lstatSync(match).isDirectory());
  process.env.EMBARK_NO_SHIM='t';
  dirs.forEach(dir => {
    execSync(
      `echo ${dir} && node ${path.join(__dirname, '../bin/embark')} reset || exit 0`,
      {cwd: dir, stdio: 'inherit'}
    );
  });
} catch (e) {
  process.exit(1);
}

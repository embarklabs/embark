/* global __dirname process require */

const {execSync} = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

process.env.DAPP_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'embark-test-'));
fs.copySync(path.join(__dirname, '../dist/test'), process.env.DAPP_PATH);

execSync(
  [`nyc`,
   `--reporter=html`,
   `mocha`,
   `"dist/test/**/*.js"`,
   `--exit`,
   `--no-timeouts`,
   `--require source-map-support/register`].join(' '),
  {cwd: path.join(__dirname, '..'), stdio: 'inherit'}
);

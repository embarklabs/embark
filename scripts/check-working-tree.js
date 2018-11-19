/* global process require */

const {execSync} = require('child_process');

try {
  execSync('git status', {stdio: 'inherit'});
  process.exit(
    execSync('git status --porcelain').toString().trim() === '' ? 0 : 1
  );
} catch (e) {
  process.exit(1);
}

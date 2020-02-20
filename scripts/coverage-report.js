const fs = require('fs-extra');
const {execSync} = require('child_process');
const path = require('path');
const rimraf = require('util').promisify(require('rimraf'));

const reportDir = path.join(__dirname, '../coverage');
const cmd = `npx nyc report --reporter=html --report-dir=${reportDir}`;

(async () => {
  await fs.mkdirp(reportDir);
  await rimraf(path.join(reportDir, '*'));
  execSync(cmd, {cwd: path.join(__dirname, '..'), stdio: 'inherit'});
})();

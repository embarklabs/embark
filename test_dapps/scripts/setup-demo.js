/* global __dirname process require */

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const workDir = path.join(__dirname, '../packages');
  const demoDir = path.join(workDir, 'embark_demo');
  if (!fs.existsSync(demoDir)) {
    const SCRIPT_EMBARK_BIN = process.env.SCRIPT_EMBARK_BIN;
    let EMBARK_BIN;
    if (SCRIPT_EMBARK_BIN) {
      EMBARK_BIN = `node ${SCRIPT_EMBARK_BIN}`;
    } else {
      EMBARK_BIN = `embark`;
    }
    process.env.EMBARK_NO_SHIM='t';
    execSync(`${EMBARK_BIN} demo`, {cwd: workDir, stdio: 'inherit'});
    const pkgJsonPath = path.join(demoDir, 'package.json');
    const pkgJson = require(pkgJsonPath);
    if (!pkgJson.devDependencies) pkgJson.devDependencies = {};
    pkgJson.devDependencies['cross-env'] = '5.2.0';
    pkgJson.devDependencies['rimraf'] = '2.6.3';
    pkgJson.name = 'embark_demo';
    pkgJson.private = true;
    if (!pkgJson.scripts) pkgJson.scripts = {};
    pkgJson.scripts.clean = 'npx cross-env-shell "node $EMBARK_BIN reset || exit 0"';
    pkgJson.scripts.reset = 'npm run clean && npx rimraf node_modules';
    pkgJson.scripts.test = 'cross-env-shell "node $EMBARK_BIN test"';
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    execSync(`npm install --loglevel=error`, {cwd: demoDir});
  }
} catch (e) {
  process.exit(1);
}

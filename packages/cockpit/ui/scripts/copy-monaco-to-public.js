const findUp = require('find-up');
const {copy, ensureDir} = require('fs-extra');
const path = require('path');

const {promisify} = require('util');
const rimraf = promisify(require('rimraf'));

async function main() {
  const which = process.argv[2] || 'min';
  const monacoDir = await findUp('node_modules/monaco-editor', {type: 'directory'});
  const vsDir = path.join(__dirname, '..', 'public', 'vsdir');
  const innerVsDir = path.join(vsDir, 'vsdir');

  await rimraf(vsDir);
  await ensureDir(innerVsDir);
  await copy(path.join(monacoDir, which), innerVsDir);

  const minMapsDir = path.join(vsDir, 'min-maps');
  await rimraf(minMapsDir);

  if (which === 'min') {
    await ensureDir(minMapsDir);
    await copy(path.join(monacoDir, 'min-maps'), minMapsDir);
  }
}

main();

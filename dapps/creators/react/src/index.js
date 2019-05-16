/* global __dirname require */

import {execSync} from 'child_process';
import {join, resolve} from 'path';

function areRequiredOptions(options) {
  Object.entries(options)
    .forEach(([name, value]) => {
      if (!value) throw new TypeError(`${name} is a required option`);
    });
}

function isInGitRepository(projectDir) {
  try {
    execSync(
      'git rev-parse --is-inside-work-tree',
      {cwd: resolve(projectDir), stdio: 'ignore'}
    );
    return true;
  } catch (e) {
    return false;
  }
}

function tryGitCommit(projectDir, committerName) {
  try {
    execSync(
      'git --version',
      {cwd: resolve(projectDir), stdio: 'ignore'}
    );

    if (!isInGitRepository(projectDir)) return;

    execSync(
      'git add -A',
      {cwd: resolve(projectDir), stdio: 'ignore'}
    );

    execSync(
      `git commit -m 'Initial commit from ${committerName}'`,
      {stdio: 'ignore'}
    );
  } catch (e) { return; }
}

export async function create(options, cli, committerName) {
  if (cli) options = require(cli).default;

  let {
    wrappedCliPkgCliOptions = {},
    wrappedCliPkgName,
    wrappedCliPkgVer,
    embarkInitBin = join(__dirname, '../node_modules/.bin/embark-init'),
    projectDir,
    templateDir,
    useExisting = false
  } = options || {};

  areRequiredOptions({
    wrappedCliPkgName,
    wrappedCliPkgVer,
    projectDir,
    templateDir
  });

  let wrappedCliPkg;
  if (useExisting) {
    wrappedCliPkg = wrappedCliPkgName;
  } else {
    wrappedCliPkg = `${wrappedCliPkgName}@${wrappedCliPkgVer}`;
  }

  wrappedCliPkgCliOptions = Object.entries(wrappedCliPkgCliOptions)
    .map(entry => entry.join(' ').trim())
    .join(' ');

    console.log(require('util').inspect(wrappedCliPkgCliOptions));

/*   execSync(
    `npx ${wrappedCliPkg} ${wrappedCliPkgCliOptions}`.trim(),
    {stdio: 'inherit'}
   );
 */
  execSync(
    embarkInitBin,
    {cwd: resolve(projectDir), stdio: 'inherit'}
  );

  // require(templateDir).create(options);

  // tryGitCommit(projectDir, committerName);
}

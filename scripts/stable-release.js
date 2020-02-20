const chalk = require('chalk');
const {execSync} = require('child_process');
const minimist = require('minimist');
const path = require('path');
const {readJsonSync} = require('fs-extra');
const semver = require('semver');

const args = minimist(process.argv.slice(2));

const DEFAULT_SKIP_QA = false;
const skipQa = args['skip-qa'] || DEFAULT_SKIP_QA;

const branch = `master`;
const commitMsg = `chore(release): %v`;
const distTag = `latest`;
const remote = `origin`;

const cyan = (str) => chalk.cyan(str);
const execSyncInherit = (cmd) => execSync(cmd, {stdio: 'inherit'});
const log = (mark, str, which = 'log') => console[which](
  mark, str.filter(s => !!s).join(` `)
);
const logError = (...str) => log(chalk.red(`✘`), str, 'error');
const logInfo = (...str) => log(chalk.blue(`ℹ`), str);
const logSuccess = (...str) => log(chalk.green(`✔`), str);
const logWarning = (...str) => log(chalk.yellow('‼︎'), str);

const failMsg = `${chalk.red(`STABLE RELEASE FAILED!`)} Stopping right here.`;

const runCommand = (cmd, inherit = true, display) => {
  logInfo(`Running command ${cyan(display || cmd)}.`);
  let out;
  if (inherit) {
    execSyncInherit(cmd);
  } else {
    out = execSync(cmd);
  }
  return out;
};

// eslint-disable-next-line complexity
(async () => {
  if (!process.env.GH_TOKEN) {
    logError(
      `Environment variable ${cyan('GH_TOKEN')} was not defined or falsy. It`,
      `must be defined with a properly scoped GitHub personal access token.`
    );
    logError(failMsg);
    process.exit(1);
  }

  const lernaJsonPath = path.join(__dirname, '../lerna.json');
  logInfo(`Reading ${cyan(lernaJsonPath)}...`);

  let currentVersion, lernaJson, registry;
  try {
    lernaJson = readJsonSync(lernaJsonPath);
    currentVersion = lernaJson.version;
    if (!currentVersion) throw new Error('missing version in lerna.json');
    registry = lernaJson.command.publish.registry;
    if (!registry) throw new Error('missing registry in lerna.json');
  } catch (e) {
    console.error(e.stack || e);
    logError(
      `Could not read values from ${cyan(lernaJsonPath)}. Please check the`,
      `error above.`
    );
    logError(failMsg);
    process.exit(1);
  }

  try {
    if (!semver(currentVersion).prerelease.length) {
      logError(
        `Current version in ${cyan('lerna.json')} is not a prerelease. This`,
        `script is intended only for graduating a prerelease to a stable`,
        `release.`
      );
      logError(failMsg);
      process.exit(1);
    }
    logSuccess(
      `Current version in ${cyan('lerna.json')} is ${cyan(currentVersion)}.`
    );
  } catch (e) {
    logError(`A problem occured. Please check the error above.`);
    logError(failMsg);
    process.exit(1);
  }

  logInfo(`Determining the latest stable version...`);

  let latestStableVersion;
  try {
    const stableReleaseTags = runCommand(`git tag --list`, false)
          .toString()
          .trim()
          .split('\n')
          .filter(tag => tag.startsWith('v') && !tag.includes('-'))
          .map(tag => tag.slice(1));
    latestStableVersion = semver.rsort(stableReleaseTags)[0];
    if (!latestStableVersion) {
      logError(`Unable to determine the latest stable version.`);
      logError(failMsg);
      process.exit(1);
    }
    logSuccess(`Latest stable version is ${cyan(latestStableVersion)}.`);
  } catch (e) {
    logError(`A problem occured. Please check the error above.`);
    logError(failMsg);
    process.exit(1);
  }

  let forcePublish;
  try {
    const currentMajor = semver(currentVersion).major;
    const stableMajor = semver(latestStableVersion).major;
    if (currentMajor > stableMajor) {
      forcePublish = true;
    } else if (currentMajor < stableMajor) {
      logError(
        `Major version of the current version in ${cyan('lerna.json')} is less`,
        `than the major version of the latest stable version. wat.`
      );
      logError(failMsg);
      process.exit(1);
    }
  } catch (e) {
    logError(`A problem occured. Please check the error above.`);
    logError(failMsg);
    process.exit(1);
  }

  logInfo(`Determining the current branch...`);

  let currentBranch;
  try {
    currentBranch = runCommand(`git rev-parse --abbrev-ref HEAD`, false)
      .toString()
      .trim();
  } catch (e) {
    logError(`Could not determine the branch. Please check the error above.`);
    logError(failMsg);
    process.exit(1);
  }

  if (currentBranch === branch) {
    logSuccess(`Current branch and release branch are the same.`);
  } else {
    logError(
      `Current branch ${cyan(currentBranch)} is not the same as release branch`,
      `${cyan(branch)}.`
    );
    logError(failMsg);
    process.exit(1);
  }

  logInfo(
    `Fetching commits from ${cyan(remote)} to compare local and remote`,
    `branches...`
  );

  try {
    runCommand(`git fetch ${remote}`, false);
  } catch (e) {
    logError(`Could not fetch latest commits. Please check the error above.`);
    logError(failMsg);
    process.exit(1);
  }

  let localRef, remoteRef;
  try {
    localRef = runCommand(`git rev-parse ${branch}`, false).toString().trim();
    remoteRef = runCommand(`git rev-parse ${remote}/${branch}`, false)
      .toString()
      .trim();
  } catch (e) {
    logError(`A problem occured. Please check the error above.`);
    logError(failMsg);
    process.exit(1);
  }

  if (localRef === remoteRef) {
    logSuccess(`Local branch is in sync with remote branch.`);
  } else {
    logError(
      `Local branch ${cyan(branch)} is not in sync with`,
      `${cyan(`${remote}/${branch}`)}.`
    );
    logError(failMsg);
    process.exit(1);
  }

  if (skipQa) {
    logWarning(
      `Skipping the QA suite. You already built the packages, right?`
    );
  } else {
    logInfo(
      `It's time to run the QA suite, this will take awhile...`
    );

    try {
      runCommand(`npm run qa:full`);
      logSuccess(`All steps succeeded in the QA suite.`);
    } catch (e) {
      logError(`A step failed in the QA suite. Please check the error above.`);
      logError(failMsg);
      process.exit(1);
    }
  }

  // The `--all` option is not supplied below because `lerna changed` is being
  // used to calculate which packages should be tagged via:
  // `npm dist-tag add [pkg]@[newStableVersion] nightly`
  // Private packages are never tagged because dist-tags only pertain to
  // packages published to the NPM registry. By tagging every newly released
  // stable version of public packages as `nightly` (in addition to tagging as
  // `latest`) we avoid version drift in nightly releases
  const lernaChanged = [
    `lerna`,
    `changed`,
    (!forcePublish && `--conventional-graduate`) || ``,
    (forcePublish && `--force-publish`) || ``,
    `--json`
  ].filter(str => !!str).join(` `);

  let pkgsToTag;
  try {
    pkgsToTag = JSON.parse(
      runCommand(`${lernaChanged} 2>/dev/null || true`, false, lernaChanged)
        .toString()
        .trim() || '[]'
    );
  } catch (e) {
    logError(`A problem occured. Please check the error above.`);
    logError(failMsg);
    process.exit(1);
  }

  const lernaPublish = [
    `lerna`,
    `publish`,
    `--conventional-commits`,
    (!forcePublish && `--conventional-graduate`) || ``,
    `--create-release github`,
    `--dist-tag ${distTag}`,
    (forcePublish && `--force-publish`) || ``,
    `--git-remote ${remote}`,
    `--message "${commitMsg}"`,
    `--registry ${registry}`
  ].filter(str => !!str).join(` `);

  try {
    runCommand(lernaPublish);
    if (localRef ===
        runCommand(`git rev-parse ${branch}`, false).toString().trim()) {
      logWarning(
        chalk.yellow(`STABLE RELEASE STOPPED!`),
        `No commit or tag was created. No packages were published. This is`,
        `most likely due to no qualifying changes having been made to the`,
        `${cyan(branch)} branch since the previous release. Please check the`,
        `output above.`
      );
      process.exit(0);
    }
  } catch (e) {
    logError(`A problem occured. Please check the error above.`);
    const lernaDocsUrl = 'https://github.com/lerna/lerna/tree/master/commands/publish#bump-from-package';
    logError(
      failMsg,
      `Make sure to clean up commits, tags, and releases as necessary. Check`,
      `the package registry to verify if any packages were published. If so`,
      `they may need to be flagged as deprecated since the`,
      `${cyan('lerna publish')} command exited with error. In some cases it`,
      `may be possible to salvage an imcomplete release by using the`,
      `${cyan('from-package')} keyword with the ${cyan('lerna publish')}`,
      `command. See: ${lernaDocsUrl}`
    );
    process.exit(1);
  }

  if (pkgsToTag.length) {
    logInfo(`Reading ${cyan(lernaJsonPath)}...`);

    let updatedCurrentVersion;
    try {
      lernaJson = readJsonSync(lernaJsonPath);
      updatedCurrentVersion = lernaJson.version;
      if (!updatedCurrentVersion) throw new Error('missing version in lerna.json');
      logSuccess(`Updated current version is ${updatedCurrentVersion}`);
    } catch (e) {
      console.error(e.stack || e);
      logError(
        `Could not read values from ${cyan(lernaJsonPath)}. Please check the`,
        `error above.`
      );
      logError(failMsg);
      process.exit(1);
    }

    logInfo(
      `Updating ${cyan('nightly')} dist-tags to point to the new stable`,
      `version...`
    );
    logInfo('Packages to tag:', pkgsToTag.map(({name}) => cyan(name)).join(', '));

    const _pkgsToTag = pkgsToTag.slice();
    try {
      for (const {name} of pkgsToTag) {
        runCommand(`npm dist-tag add ${name}@${updatedCurrentVersion} nightly`);
        _pkgsToTag.shift();
      }
    } catch (e) {
      logError(`A problem occured. Please check the error above.`);
      const packages = _pkgsToTag.map(({name}) => cyan(name)).join(', ');
      logError(
        `NPM dist-tag ${cyan('nightly')} was not updated for the following`,
        `packages: ${packages}. Make sure to complete the updates manually.`
      );
      logError(failMsg);
      process.exit(1);
    }
  }

  logSuccess(`${chalk.green(`STABLE RELEASE SUCCEEDED!`)} Woohoo! Done.`);
})().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e.stack || e);
  logError(`A problem occured. Please check the error above.`);
  logError(failMsg);
  process.exit(1);
});

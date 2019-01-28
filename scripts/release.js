/* global __dirname process require */

const chalk = require('chalk');
const {execSync} = require('child_process');
const minimist = require('minimist');
const path = require('path');
const {prompt} = require('promptly');
const semver = require('semver');

const args = minimist(process.argv.slice(2));

const DEFAULT_BUMP = null;
const bump = args._[0] || DEFAULT_BUMP;

const DEFAULT_COMMIT_MSG = `chore(release): %v`;
const commitMsg = args['commit-message'] || DEFAULT_COMMIT_MSG;

const DEFAULT_DIST_TAG = `latest`;
const distTag = args['dist-tag'] || DEFAULT_DIST_TAG;

const DEFAULT_GIT_REMOTE = `origin`;
const remote = args['git-remote'] || DEFAULT_GIT_REMOTE;

const DEFAULT_PRE_ID = null;
const preId = args.preid || DEFAULT_PRE_ID;

const DEFAULT_RELEASE_BRANCH = `master`;
const branch = args['release-branch'] || DEFAULT_RELEASE_BRANCH;

const DEFAULT_SIGN = false;
const sign = args.sign || DEFAULT_SIGN;

const cyan = (str) => chalk.cyan(str);
const execSyncInherit = (cmd) => execSync(cmd, {stdio: 'inherit'});
const log = (mark, str, which = 'log') => console[which](
  mark, str.filter(s => !!s).join(` `)
);
const logError = (...str) => log(chalk.red(`✘`), str, 'error');
const logInfo = (...str) => log(chalk.blue(`ℹ`), str);
const logSuccess = (...str) => log(chalk.green(`✔`), str);
const logWarning = (...str) => log(chalk.yellow('‼︎'), str);

const failMsg = `${chalk.red(`RELEASE FAILED!`)} Stopping right here.`;

const reportSetting = (desc, val, def) => {
  logInfo(`${desc} is set to ${cyan(val)}${val === def ? ` (default).`: `.`}`);
};

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

(async () => {
  try {
    let DEFAULT_REGISTRY, registry;
    const lernaJsonPath = path.join(__dirname, '../lerna.json');
    try {
      const lernaJson = require(lernaJsonPath);

      DEFAULT_REGISTRY = lernaJson.command.publish.registry;
      if (!DEFAULT_REGISTRY) throw new Error('missing registry in lerna.json');
      registry = args.registry || DEFAULT_REGISTRY;
    } catch (e) {
      console.error(e.stack);
      logError(
        `Could not read values from ${cyan(lernaJsonPath)}.`,
        `Please check the error above.`
      );
      throw new Error();
    }

    logInfo(`Checking the working tree...`);

    try {
      runCommand(`npm run --silent cwtree`, true, `npm run cwtree`);
      logSuccess(`Working tree is clean.`);
    } catch (e) {
      logError(
        `Working tree is dirty or has untracked files.`,
        `Please make necessary changes or commits before rerunning this script.`
      );
      throw new Error();
    }

    reportSetting(`Release branch`, branch, DEFAULT_RELEASE_BRANCH);
    logInfo(`Determining the current branch...`);

    let currentBranch;
    try {
      currentBranch = runCommand(`git rev-parse --abbrev-ref HEAD`, false)
        .toString()
        .trim();
    } catch (e) {
      logError(`Could not determine the branch. Please check the error above.`);
      throw new Error();
    }

    if (currentBranch === branch) {
      logSuccess(`Current branch and release branch are the same.`);
    } else {
      logError(
        `Current branch ${cyan(currentBranch)} is not the same as release`,
        `branch ${cyan(branch)}. Please checkout the release branch before`,
        `rerunning this script or rerun with`,
        `${cyan(`--release-branch ${currentBranch}`)}.`
      );
      throw new Error();
    }

    reportSetting(`Git remote`, remote, DEFAULT_GIT_REMOTE);
    logInfo(
      `Fetching commits from ${cyan(remote)}`,
      `to compare local and remote branches...`
    );

    try {
      runCommand(`git fetch ${remote}`, false);
    } catch (e) {
      logError(`Could not fetch latest commits. Please check the error above.`);
      throw new Error();
    }

    let localRef, remoteRef;
    try {
      localRef = runCommand(`git rev-parse ${branch}`, false).toString().trim();
      remoteRef = (
        runCommand(`git rev-parse ${remote}/${branch}`, false).toString().trim()
      );
    } catch (e) {
      logError(`A problem occured. Please check the error above.`);
      throw new Error();
    }

    if (localRef === remoteRef) {
      logSuccess(`Local branch is in sync with remote branch.`);
    } else {
      logError(
        `Local branch ${cyan(branch)} is not in sync with`,
        `${cyan(`${remote}/${branch}`)}.`,
        `Please sync branches before rerunning this script.`
      );
      throw new Error();
    }

    logInfo(
      `It's time to run the QA suite, this will take awhile...`
    );

    try {
      runCommand(`npm run qa`);
      logSuccess(`All steps succeeded in the QA suite.`);
    } catch (e) {
      logError(`A step failed in the QA suite. Please check the error above.`);
      throw new Error();
    }

    logInfo(`Publishing with Lerna...`);
    if (bump) reportSetting(`Version bump`, bump, DEFAULT_BUMP);
    if (preId) reportSetting(`Prerelease identifier`, preId, DEFAULT_PRE_ID);
    reportSetting(`Package distribution tag`, distTag, DEFAULT_DIST_TAG);
    reportSetting(`Commit message format`, commitMsg, DEFAULT_COMMIT_MSG);
    reportSetting(`Signature option`, sign, DEFAULT_SIGN);
    reportSetting(`Package registry`, registry, DEFAULT_REGISTRY);

    const lernaPublish = [
      `lerna publish`,
      bump || ``,
      (preId && `--preid ${preId}`) || ``,
      `--dist-tag ${distTag}`,
      `--conventional-commits`,
      `--message "${commitMsg}"`,
      (sign && `--sign-git-commit`) || ``,
      (sign && `--sign-git-tag`) || ``,
      `--git-remote ${remote}`,
      `--registry ${registry}`
    ].filter(str => !!str).join(` `);

    try {
      runCommand(lernaPublish);
      if (localRef ===
          runCommand(`git rev-parse ${branch}`, false).toString().trim()) {
        logWarning(
          chalk.yellow(`RELEASE STOPPED!`),
          `No commit or tag was created. No packages were published.`
        );
        process.exit(0);
      }
    } catch (e) {
      console.error();
      logError(`A problem occured. Please check the error above.`);
      throw new Error();
    }

    logSuccess(`${chalk.green(`RELEASE SUCCEEDED!`)} Woohoo! Done.`);
  } catch (e) {
    logError(
      failMsg,
      `Make sure to clean up the working tree and local/remote commits and`,
      `tags as necessary. Check the package registry to verify no packages`,
      `were published.`
    );
    process.exit(1);
  }
})();

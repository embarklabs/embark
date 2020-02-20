const chalk = require('chalk');
const {execSync} = require('child_process');
const path = require('path');
const {readJsonSync} = require('fs-extra');

const branch = `master`;
const commitMsg = `chore(prerelease): %v`;
const distTag = `nightly`;
const preId = `nightly`;
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

const failMsg = `${chalk.red(`NIGHTLY RELEASE FAILED!`)} Stopping right here.`;

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
  if (!process.env.GH_TOKEN) {
    logError(
      `Environment variable ${cyan('GH_TOKEN')} was not defined or falsy. It`,
      `must be defined with a properly scoped GitHub personal access token.`
    );
    logError(failMsg);
    process.exit(1);
  }

  if (!process.env.IS_GITHUB_ACTIONS_WORKFLOW) {
    logError(
      `This script should only be run in the context of a GitHub Actions`,
      `workflow (that workflow should set the environment variable`,
      `${cyan('IS_GITHUB_ACTIONS_WORKFLOW')} to a truthy value).`
    );
    logError(failMsg);
    process.exit(1);
  }

  const lernaJsonPath = path.join(__dirname, '../lerna.json');
  logInfo(`Reading ${cyan(lernaJsonPath)}...`);

  let lernaJson, registry;
  try {
    lernaJson = readJsonSync(lernaJsonPath);
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

  const lernaPublish = [
    `lerna`,
    `publish`,
    `--conventional-commits`,
    `--conventional-prerelease`,
    `--create-release github`,
    `--dist-tag ${distTag}`,
    `--git-remote ${remote}`,
    `--message "${commitMsg}"`,
    `--preid ${preId}`,
    `--registry ${registry}`,
    `--yes`
  ].filter(str => !!str).join(` `);

  try {
    runCommand(lernaPublish);
    if (localRef ===
        runCommand(`git rev-parse ${branch}`, false).toString().trim()) {
      logWarning(
        chalk.yellow(`NIGHTLY RELEASE STOPPED!`),
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

  logSuccess(`${chalk.green(`NIGHTLY RELEASE SUCCEEDED!`)} Woohoo! Done.`);
})().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e.stack || e);
  logError(`A problem occured. Please check the error above.`);
  logError(failMsg);
  process.exit(1);
});

/* global process require */

const chalk = require('chalk');
const {execSync} = require('child_process');
const minimist = require('minimist');
const {prompt} = require('promptly');
const standardVersion = require('standard-version');

const args = minimist(process.argv.slice(2));

const DEFAULT_UPSTREAM_REPO_BRANCH = 'master';
const DEFAULT_UPSTREAM_REPO_ORIGIN = 'origin';
const branch = args['repo-branch'] || DEFAULT_UPSTREAM_REPO_BRANCH;
const origin = args['repo-origin'] || DEFAULT_UPSTREAM_REPO_ORIGIN;

const distTag = args['npm-dist-tag'];
const dryRun = args['dry-run'];
const prerelease = args.prerelease;
const releaseAs = args['release-as'];
const sign = args.sign;

// eslint-disable-next-line no-confusing-arrow
const dryRunMaybe = () => dryRun ? leftPad1(chalk.yellow('(DRY RUN)')) : '';
const execSyncInherit = (cmd) => execSync(cmd, {stdio: 'inherit'});
// eslint-disable-next-line no-confusing-arrow
const leftPad1 = (str) => ' ' + str;
// eslint-disable-next-line no-confusing-arrow
const leftPad1Maybe = (str) => str ? leftPad1(str) : str;
const log = (mark, str) => console.log(mark, str.filter(s => !!s).join(' '));
const logError = (...str) => log(chalk.red('✘'), str);
const logInfo = (...str) => log(chalk.blue('ℹ'), str);
const logSuccess = (...str) => log(chalk.green('✔'), str);
const logWarning = (...str) => log(chalk.yellow('‼︎'), str);

const yesNoValidator = (input) => {
  const _input = input && input[0].toLowerCase();
  if (!['y', 'n'].includes(_input)) {
    throw new Error(chalk.red('✘') + leftPad1(`Please answer [y]es or [n]o.`));
  }
  return _input;
};

const promptOpts = {default: 'blank', validator: yesNoValidator};

const proceedAnywayPrompt = async () => {
  let answer = await prompt(
    `${chalk.yellow('⁉︎')} Proceed anyway? [y/n]`,
    promptOpts
  );
  if (answer === 'n') {
    logWarning(`Stopping right here.`);
    process.exit(0);
  }
};

const dryRunPrompt = async () => {
  let answer = await prompt(
    `${chalk.blue('⁇')} This is ${chalk.yellow('NOT')} a --dry-run.` +
      leftPad1(`Did you complete a successful --dry-run first? [y/n]`),
    promptOpts
  );
  if (answer === 'n') await proceedAnywayPrompt();
};

(async () => {
  try {
    if (!dryRun) await dryRunPrompt();

    logInfo(`Determining the current branch...`);

    let currentBranch;
    try {
      currentBranch = execSync(`git rev-parse --abbrev-ref HEAD`)
        .toString()
        .trim();
    } catch (e) {
      logError(`Couldn't determine the branch. Please check the error above.`);
      throw new Error();
    }

    if (currentBranch !== branch) {
      logError(
        `Current branch '${currentBranch}' is not the same as release branch`,
        `'${branch}'. Please checkout the release branch before rerunning this`,
        `script or rerun with '--repo-branch ${currentBranch}'.`
      );
      throw new Error();
    }

    logSuccess(`Current branch and release branch are the same.`);
    logInfo(`Checking the working tree...`);

    try {
      execSyncInherit(`npm run --silent check-working-tree`);
      logSuccess(`Working tree is clean.`);
    } catch (e) {
      logError(
        `Working tree is dirty or has untracked files. Please make necessary`,
        `changes or commits before rerunning this script.`
      );
      throw new Error();
    }

    logInfo(
      `Fetching from origin '${origin}' to compare local and remote branches...`
    );

    try {
      execSyncInherit(`git fetch ${origin}`);
    } catch (e) {
      logError(`Couldn't fetch latest commits. Please check the error above.`);
      throw new Error();
    }

    let localRef, originRef;
    try {
      localRef = execSync(`git rev-parse ${branch}`).toString();
      originRef = execSync(`git rev-parse ${origin}/${branch}`).toString();
    } catch (e) {
      logError(`A problem occured. Please check the error above.`);
      throw new Error();
    }

    if (localRef !== originRef) {
      logError(
        `Local branch '${branch}' is not in sync with '${origin}/${branch}'.`,
        `Please sync branches before rerunning this script.`
      );
      throw new Error();
    }

    logSuccess(`Local branch is in sync with remote branch.`);
    logInfo(`Running Standard Version${dryRunMaybe()}...`);

    await standardVersion({
      dryRun,
      prerelease,
      releaseAs,
      sign
    });

    logInfo(`Publishing new Embark version on npm${dryRunMaybe()}...`);

    const npmPublishCommand = [
      `npm publish`,
      leftPad1Maybe(`${distTag ? `--tag ${distTag}` : ''}`),
      leftPad1Maybe(`${dryRun ? '--dry-run' : ''}`)
    ].join('');

    try {
      execSyncInherit(npmPublishCommand);
      logSuccess(`Successfully published latest version${dryRunMaybe()}.`);
    } catch (e) {
      logError(
        `Couldn't publish version on npm${dryRunMaybe()}.`,
        `Please check the error above.`
      );
      throw new Error();
    }

    logInfo(
      `Pushing release commit and tag to origin '${origin}' on branch`,
      `'${branch}'${dryRunMaybe()}...`
    );

    const gitPushCommand = [
      `git push --follow-tags ${origin} ${branch}`,
      leftPad1Maybe(`${dryRun ? '--dry-run' : ''}`)
    ].join('');

    try {
      execSyncInherit(gitPushCommand);
      logSuccess(`Successfully pushed${dryRunMaybe()}.`);
    } catch (e) {
      logError(
        `Couldn't push${dryRunMaybe()}. Please check the error above.`
      );
      throw new Error();
    }

    logSuccess(`Woohoo! Done${dryRunMaybe()}.`);
  } catch (e) {
    logError(
      `Stopping right here${dryRunMaybe()}.`,
      dryRun ? '' : `Make sure to clean up commits and tags as necessary.`
    );
    process.exit(1);
  }
})();

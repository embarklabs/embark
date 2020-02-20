const chalk = require('chalk');
const {execSync} = require('child_process');
const minimist = require('minimist');
const path = require('path');
const {readJsonSync} = require('fs-extra');

const args = minimist(process.argv.slice(2));

const DEFAULT_BUMP = null;
const bump = args._[0] || DEFAULT_BUMP;

const DEFAULT_COMMIT_MSG = `chore(release): %v`;
const commitMsg = args['commit-message'] || DEFAULT_COMMIT_MSG;

const DEFAULT_CONVENTIONAL_COMMITS = true;
let cCommits;
// with --no-conventional-commits cli option `args['conventional-commits']` will be `false`
// there is never a need to use --conventional-commits cli option because the
// default behavior is `true`
if (args['conventional-commits'] === false) {
  cCommits = false;
} else {
  cCommits = DEFAULT_CONVENTIONAL_COMMITS;
}

const DEFAULT_CONVENTIONAL_GRADUATE = false;
const cGraduate = args['conventional-graduate'] || DEFAULT_CONVENTIONAL_GRADUATE;

const DEFAULT_CONVENTIONAL_PRERELEASE = false;
const cPrerelease = args['conventional-prerelease'] || DEFAULT_CONVENTIONAL_PRERELEASE;

// if not using --no-create-release or --no-push cli option then an environment
// variable named GH_TOKEN must be defined with a properly scoped GitHub
// personal access token; for local releases, e.g. with verdaccio,
// --no-create-release should be used (unless using --no-push, which implies
// --no-create-release)
// See: https://github.com/lerna/lerna/tree/master/commands/version#--create-release-type
const DEFAULT_CREATE_RELEASE = true;
let createRelease;
// with --no-create-release cli option `args['create-release']` will be `false`
// there is never a need to use --create-release cli option because the default
// is `true`
if (args['create-release'] === false) {
  createRelease = false;
} else {
  createRelease = DEFAULT_CREATE_RELEASE;
}

const DEFAULT_DIST_TAG = `latest`;
const distTag = args['dist-tag'] || DEFAULT_DIST_TAG;

const DEFAULT_FORCE_PUBLISH = false;
const forcePublish = args['force-publish'] || DEFAULT_FORCE_PUBLISH;

const DEFAULT_GIT_REMOTE = `origin`;
const remote = args['git-remote'] || DEFAULT_GIT_REMOTE;

const DEFAULT_NO_PUSH = false;
let noPush;
// with --no-push cli option `args['push']` will be `false`
// there is never a need to use --push cli option because the default behavior
// is to push
if (args['push'] === false) {
  noPush = true;
} else {
  noPush = DEFAULT_NO_PUSH;
}

const DEFAULT_PRE_ID = null;
const preId = args.preid || DEFAULT_PRE_ID;

const DEFAULT_RELEASE_BRANCH = `master`;
const branch = args['release-branch'] || DEFAULT_RELEASE_BRANCH;

const DEFAULT_SIGN = false;
const sign = args.sign || DEFAULT_SIGN;

const DEFAULT_SKIP_QA = false;
const skipQa = args['skip-qa'] || DEFAULT_SKIP_QA;

const DEFAULT_VERSION_ONLY = false;
const versionOnly = args['version-only'] || DEFAULT_VERSION_ONLY;

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

// eslint-disable-next-line complexity
(async () => {
  if (!noPush && createRelease && !process.env.GH_TOKEN) {
    logError(
      `Environment variable ${cyan('GH_TOKEN')} was not defined or falsy. It`,
      `must be defined with a properly scoped GitHub personal access token,`,
      `or else the ${cyan('--no-create-release')} or ${cyan('--no-push')}`,
      `option should be used. Always use ${cyan('--no-create-release')} when`,
      `running a local release, e.g. with ${cyan('verdaccio')} (unless using`,
      `${cyan('--no-push')}, which implies ${cyan('--no-create-release')}).`
    );
    logError(failMsg);
    process.exit(1);
  }

  const lernaJsonPath = path.join(__dirname, '../lerna.json');
  logInfo(`Reading ${cyan(lernaJsonPath)}...`);

  let lernaJson;
  try {
    lernaJson = readJsonSync(lernaJsonPath);
  } catch (e) {
    console.error(e.stack || e);
    logError(
      `Could not read ${cyan(lernaJsonPath)}. Please check the error above.`
    );
    logError(failMsg);
    process.exit(1);
  }

  let DEFAULT_REGISTRY, registry;
  if (!versionOnly) {
    try {
      DEFAULT_REGISTRY = lernaJson.command.publish.registry;
      if (!DEFAULT_REGISTRY) throw new Error('missing registry in lerna.json');
      registry = args.registry || DEFAULT_REGISTRY;
    } catch (e) {
      console.error(e.stack || e);
      logError(
        `Could not read values from ${cyan(lernaJsonPath)}. Please check the`,
        `error above.`
      );
      logError(failMsg);
      process.exit(1);
    }
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
    logError(failMsg);
    process.exit(1);
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
    logError(failMsg);
    process.exit(1);
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
    logError(failMsg);
    process.exit(1);
  }

  let localRef;
  if (!noPush) {
    reportSetting(`Git remote`, remote, DEFAULT_GIT_REMOTE);
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

    let remoteRef;
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
        `${cyan(`${remote}/${branch}`)}.`,
        `Please sync branches before rerunning this script.`
      );
      logError(failMsg);
      process.exit(1);
    }
  } else {
    try {
      localRef = runCommand(`git rev-parse ${branch}`, false).toString().trim();
    } catch (e) {
      logError(`A problem occured. Please check the error above.`);
      logError(failMsg);
      process.exit(1);
    }
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

  logInfo(`${versionOnly ? 'Versioning' : 'Publishing'} with Lerna...`);
  if (bump) reportSetting(`Version bump`, bump, DEFAULT_BUMP);
  reportSetting(`Conventional commits option`, cCommits, DEFAULT_CONVENTIONAL_COMMITS);
  reportSetting(`Conventional graduate option`, cGraduate, DEFAULT_CONVENTIONAL_GRADUATE);
  reportSetting(`Conventional prerelease option`, cPrerelease, DEFAULT_CONVENTIONAL_PRERELEASE);
  if (!noPush) reportSetting(`Create GitHub release option`, createRelease, DEFAULT_CREATE_RELEASE);
  if (!versionOnly) reportSetting(`NPM dist-tag`, distTag, DEFAULT_DIST_TAG);
  reportSetting(`Force publish option`, forcePublish, DEFAULT_FORCE_PUBLISH);
  reportSetting(`Commit message format`, commitMsg, DEFAULT_COMMIT_MSG);
  reportSetting(`No push option`, noPush, DEFAULT_NO_PUSH);
  if (preId) reportSetting(`Prerelease identifier`, preId, DEFAULT_PRE_ID);
  if(!versionOnly) reportSetting(`Package registry`, registry, DEFAULT_REGISTRY);
  reportSetting(`Signature option`, sign, DEFAULT_SIGN);

  const lernaCmd = [
    `lerna`,
    (versionOnly && `version`) || `publish`,
    bump || ``,
    (cCommits && `--conventional-commits`) || ``,
    (cCommits && cGraduate && `--conventional-graduate${cGraduate === true ? '' : `=${cGraduate}`}`) || ``,
    (cCommits && cPrerelease && `--conventional-prerelease${cPrerelease === true ? '' : `=${cPrerelease}`}`) || ``,
    (!noPush && createRelease && `--create-release github`) || ``,
    (!versionOnly && `--dist-tag ${distTag}`) || ``,
    (forcePublish && `--force-publish${forcePublish === true ? '' : `=${forcePublish}`}`) || ``,
    (!noPush && `--git-remote ${remote}`) || ``,
    `--message "${commitMsg}"`,
    (noPush && `--no-push`) || ``,
    (preId && `--preid ${preId}`) || ``,
    (!versionOnly && `--registry ${registry}`) || ``,
    (sign && `--sign-git-commit`) || ``,
    (sign && `--sign-git-tag`) || ``
  ].filter(str => !!str).join(` `);

  try {
    runCommand(lernaCmd);
    if (bump !== 'from-package' && localRef ===
        runCommand(`git rev-parse ${branch}`, false).toString().trim()) {
      let action, cmd, noPubMsg;
      if (versionOnly) {
        action = 'version creation';
        cmd = 'version';
        noPubMsg = '';
      } else {
        action = 'publication';
        cmd = 'publish';
        noPubMsg = `No packages were published. `;
      }
      logWarning(
        chalk.yellow(`RELEASE STOPPED!`),
        `No commit or tag was created. ${noPubMsg}Please check the output`,
        `above if you did not stop ${action} via a prompt from the`,
        `${cyan(`lerna ${cmd}`)} command.`
      );
      process.exit(0);
    }
  } catch (e) {
    logError(`A problem occured. Please check the error above.`);
    let checkPkgMsg;
    if (versionOnly) {
      checkPkgMsg = '';
    } else {
      const lernaDocsUrl = 'https://github.com/lerna/lerna/tree/master/commands/publish#bump-from-package';
      checkPkgMsg = [
        ` Check the package registry to verify if any packages were published.`,
        `If so they may need to be flagged as deprecated since the`,
        `${cyan(`lerna publish`)} command exited with error. In some cases it`,
        `may be possible to salvage an imcomplete release by using the`,
        `${cyan('from-package')} keyword with the ${cyan('lerna publish')}`,
        `command. See: ${lernaDocsUrl}`
      ].join(' ');
    }
    logError(
      failMsg,
      `Make sure to clean up the working tree and local/remote commits, tags,`,
      `and releases as necessary.${checkPkgMsg}`
    );
    process.exit(1);
  }

  logSuccess(`${chalk.green(`RELEASE SUCCEEDED!`)} Woohoo! Done.`);
})().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e.stack || e);
  logError(`A problem occured. Please check the error above.`);
  logError(failMsg);
  process.exit(1);
});

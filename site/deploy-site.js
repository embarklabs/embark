const { execSync } = require('child_process');
const process = require('process');
const path = require('path');
const args = require('minimist')(process.argv.slice(2));

const execWithOutput = (cmd) => execSync(cmd, { stdio: 'inherit' });

const DEPLOY_REPOSITORY = 'https://github.com/embarklabs/embark-site';
const DEPLOY_REMOTE = 'embark-site';

const TMP_DEPLOY_BRANCH = 'embark-site-deploy';
const LOCAL_DEPLOY_BRANCH = 'embark-site-deploy-dist';
const REMOTE_DEPLOY_BRANCH = 'gh-pages';
const MASTER_BRANCH = 'master';

const SITE_DIR = 'site';
const PUBLIC_DIR = 'public';
const ROOT_DIR = path.join(__dirname, '..');

const remote = args['deploy-remote'] || DEPLOY_REMOTE;
const remoteDeployBranch = args['deploy-branch'] || REMOTE_DEPLOY_BRANCH;

function main() {
  const hasCorrectRemote = execSync(`git remote -v | grep ${remote}`).toString().indexOf(remote) > -1;
  const hasCorrectRemoteRepo = remote !== DEPLOY_REMOTE ? true : execSync(`git remote -v | grep ${remote}`).toString().indexOf(DEPLOY_REPOSITORY) > -1;

  if (!hasCorrectRemote || !hasCorrectRemoteRepo) {
    console.log('Please set up the correct remote to deploy the website');
    process.exit(1);
  }
  console.log('Deploying website...');
  process.chdir(SITE_DIR);
  execWithOutput('npx hexo generate --production');
  try {
    execWithOutput('git branch -D embark-site-deploy');
  } catch (e) {
    // It's fine if that command errors
  }
  execWithOutput(`git checkout -b ${TMP_DEPLOY_BRANCH}`);
  execWithOutput(`git add -f ${PUBLIC_DIR}`);
  execWithOutput('git commit -m "chore(*): adding public folder"');
  process.chdir(ROOT_DIR);
  execWithOutput(`git subtree split -P ${SITE_DIR}/${PUBLIC_DIR} -b ${LOCAL_DEPLOY_BRANCH}`);
  execWithOutput(`git push -f ${remote} ${LOCAL_DEPLOY_BRANCH}:${remoteDeployBranch}`);
  execWithOutput(`git branch -D ${LOCAL_DEPLOY_BRANCH}`);
  execWithOutput(`git checkout ${MASTER_BRANCH}`);
  execWithOutput(`git branch -D ${TMP_DEPLOY_BRANCH}`);
}

main();


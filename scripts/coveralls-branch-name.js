const {execSync} = require('child_process');

const nameRevCmd = 'git name-rev --name-only HEAD';
let branchName = execSync(nameRevCmd).toString().trim();

if (branchName.startsWith('remotes/pull')) {
  execSync('git checkout "HEAD^2"', {stdio: 'ignore'});
  const _branchName = branchName;
  branchName = execSync(nameRevCmd).toString().trim().split('/').slice(2).join('/');
  execSync(`git checkout ${_branchName}`, {stdio: 'ignore'});
} else if (branchName.startsWith('remotes/origin')) {
  branchName = branchName.split('/').slice(2).join('/');
}

process.stdout.write(branchName);

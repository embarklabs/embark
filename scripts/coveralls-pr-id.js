const {execSync} = require('child_process');

let branchName = execSync('git name-rev --name-only HEAD').toString().trim();
let prId = '';

if (branchName.startsWith('remotes/pull')) {
  prId = branchName.split('/')[2];
}

process.stdout.write(prId);

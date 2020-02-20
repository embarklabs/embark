const {execSync} = require('child_process');
const fs = require('fs');
const {EOL} = require('os');
const path = require('path');

const embarkBinPath = path.resolve(
  path.join(__dirname, '../packages/embark/bin/embark')
);
if (!fs.existsSync(embarkBinPath)) process.exit(1);

const getStdout = (cmd) => {
  let out;
  try {
    out = execSync(
      cmd,
      {stdio: ['ignore', 'pipe', 'ignore']}
    ).toString().trim();
  } catch (e) {
    process.exit(1);
  }
  return out;
};

const npmGlobalBin = getStdout('npm --global bin');

if (process.platform === 'win32') {
  fs.writeFileSync(
    path.join(npmGlobalBin, 'embark.cmd'),
    `@node "${embarkBinPath}" %*${EOL}`
  );
} else {
  const linkPath = path.join(npmGlobalBin, 'embark');
  if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
  fs.symlinkSync(embarkBinPath, linkPath);
}

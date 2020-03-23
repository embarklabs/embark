const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { join } = require('path');

const allPackages = JSON.parse(execSync(
  'npx lerna ls --all --json',
  {cwd: join(__dirname, '..'), stdio: ['pipe', 'pipe', 'ignore']}
).toString().trim());

const allPackagesNames = new Set(allPackages.map(pkg => pkg.name));

try {
  const yarnLock = readFileSync(join(__dirname, '..', 'yarn.lock')).toString();
  const embarkPkgs = yarnLock
        .match(/embark(js)?(-\S+)?@|@embarklabs\/\S+@/g)
        .map(match => match.slice(0, -1));
  const badPkgTest = pkgName => allPackagesNames.has(pkgName);
  if (embarkPkgs && embarkPkgs.some(badPkgTest)) {
    let badPkgNames = [...(new Set(embarkPkgs))].filter(badPkgTest);
    const plur = badPkgNames.length > 1;
    console.error();
    console.error(
      [
        `Found specifier${plur ? 's' : ''} for ${badPkgNames.join(', ')} in`,
        `the root yarn.lock file.\n\nThis probably happened because some`,
        `package's version and/or dev/Deps specifiers need to be adjusted`,
        `relative to the current versions in the master branch.`
      ].join(' ')
    );
    console.error();
    process.exit(1);
  }
  process.exit(0);
} catch(e) {
  console.error(e);
  process.exit(1);
}

const {readFileSync} = require('fs');
const {join} = require('path');

try {
  const yarnLock = readFileSync(join(__dirname, '..', 'yarn.lock')).toString();
  const embarkPkgs = yarnLock.match(/embark(js)?(-\S+)?@|@embarklabs\/\S+@/g);
  const badSpecTest = spec => (
    !(spec.startsWith('embark-test-contract-') ||
      spec.startsWith('@embarklabs/ethereumjs-wallet'))
  );
  if (embarkPkgs &&
      embarkPkgs.some(badSpecTest)) {
    let badSpecs = [...(new Set(embarkPkgs))]
        .filter(badSpecTest)
        .map(spec => spec.slice(0, -1));
    const plur = badSpecs.length > 1;
    console.error();
    console.error(
      [
        `Found specifier${plur ? 's' : ''} for ${badSpecs.join(', ')} in the`,
        `root yarn.lock file.\n\nThis probably happened because some package's`,
        `version and/or dev/Deps specifiers need to be adjusted relative to`,
        `the current versions in the master branch.`
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

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { join } = require('path');
const semver = require('semver');

const allPackages = JSON.parse(execSync(
  'npx lerna ls --all --json',
  {cwd: join(__dirname, '..'), stdio: ['pipe', 'pipe', 'ignore']}
).toString().trim());

const allPackagesDict = {};

allPackages.forEach(pkg => {
  pkg.json = require(join(pkg.location, 'package.json'));
  allPackagesDict[pkg.name] = pkg;
});

allPackages.forEach(pkg => {
  function updateMismatched(depKind, [depName, depRange]) {
    const dep = allPackagesDict[depName];
    if (dep) {
      const depVersion = dep.version;
      if (!semver.satisfies(depVersion, depRange)) {
        pkg.json[depKind][depName] = `^${depVersion}`;
        pkg.updated = true;
        console.warn([
          `range specifier for ${depName} was set to ^${depVersion} in`,
          `${join(pkg.location, 'package.json')} based on "version" in`,
          `${join(dep.location, 'package.json')}`
        ].join(' '));
      }
    }
  }

  if (pkg.json.dependencies) {
    Object.entries(pkg.json.dependencies).forEach(
      updateMismatched.bind({}, 'dependencies')
    );
  }
  if (pkg.json.devDependencies) {
    Object.entries(pkg.json.devDependencies).forEach(
      updateMismatched.bind({}, 'devDependencies')
    );
  }
});

let updated;
allPackages.forEach(pkg => {
  if (pkg.updated) {
    updated = true;
    writeFileSync(
      join(pkg.location, 'package.json'),
      JSON.stringify(pkg.json, null, 2)
    );
  }
});

if (updated) {
  execSync(
    'yarn reboot:full && yarn cylock',
    {cwd: join(__dirname, '..'), stdio: 'inherit'}
  );
}

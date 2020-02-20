const fs = require('fs');
const path = require('path');

const source = path.join(process.cwd(), 'coverage/coverage-final.json');
const pkgName = path.basename(process.cwd());
const destination = path.join(process.argv[2], `coverage-${pkgName}.json`);

if (fs.existsSync(source)) {
  fs.copyFileSync(source, destination);
}

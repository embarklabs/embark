const fs = require('fs-extra');
const os = require('os');
const path = require('path');

process.env.DAPP_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'embark-test-'));

fs.copySync(path.join(__dirname, '../dist/test'), process.env.DAPP_PATH);

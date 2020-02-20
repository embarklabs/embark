const {sync: findUp} = require('find-up');
const {delimiter, dirname, join} = require('path');

const NODE_PATH = 'NODE_PATH';
const node_paths = process.env[NODE_PATH] ? process.env[NODE_PATH].split(delimiter) : [];

process.env.EMBARK_BASIC_PIPELINE_PATH = dirname(findUp('package.json', {cwd: __dirname}));

const EMBARK_BASIC_PIPELINE_NODE_MODULES_PATHS = [];
let len = 0;
let start = __dirname;
// eslint-disable-next-line no-constant-condition
while (true) {
  const found = findUp('node_modules', {cwd: start, type: 'directory'});
  if (!found) break;
  start = join(start, '..');
  if ((EMBARK_BASIC_PIPELINE_NODE_MODULES_PATHS[len - 1] !== found) &&
      !node_paths.includes(found)) {
    len = EMBARK_BASIC_PIPELINE_NODE_MODULES_PATHS.push(found);
  }
}

// NOTE: setting NODE_PATH at runtime won't effect lookup behavior in the
// current process, but will take effect in child processes
process.env[NODE_PATH] = EMBARK_BASIC_PIPELINE_NODE_MODULES_PATHS.join(delimiter) +
  (process.env[NODE_PATH] ? delimiter : '') +
  (process.env[NODE_PATH] || '');

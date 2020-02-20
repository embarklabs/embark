// there seems to be a bug in yarn whereby forwarding arguments with -- like so:
//   $ yarn monorun [...] -- --foo
// results in [...] being stripped away; can workaround with:
//   $ yarn monorun -- [...] -- --foo
// but note that yarn warns about a future behavioral change re: yarn and --

const {dirname} = require('path');
const {spawn} = require('child_process');
const {sync: findUp} = require('find-up');
const minimist = require('minimist');

const monorepoRootPath = dirname(findUp('lerna.json'));

let cliArgs = process.argv.slice(2);

const options = minimist(
  cliArgs,
  {boolean: [
    'include-filtered-dependents',
    'include-filtered-dependencies',
    'no-bail',
    'no-prefix',
    'no-private',
    'no-progress',
    'no-sort',
    'parallel',
    'reject-cycles',
    'stream'
  ]}
);

Object.keys(options).forEach(key => {
  const invKey = key.slice(3);
  if (key.startsWith('no-') && options.hasOwnProperty(invKey)) {
    options[key] = !options[invKey];
    delete options[invKey];
  }
});

process.env.EMBARK_COLLECTIVE_OPTIONS = JSON.stringify(options);

if (cliArgs.includes('--scope')) {
  cliArgs.push('--scope', 'embark-collective');
}

const npxCmd = process.platform === 'win32' ? 'npx.cmd': 'npx';
const subp = spawn(npxCmd, [
  'lerna',
  'run',
  ...cliArgs
], {
  cwd: monorepoRootPath,
  stdio: 'inherit'
});

subp.on('close', code => process.exit(code));

/* global Buffer __dirname module process require */

const filterPackages = require('@lerna/filter-packages');
const {fork, spawn} = require('child_process');
const {sync: findUp} = require('find-up');
const {readJsonSync} = require('fs-extra');
const {sync: glob} = require('glob');
const minimist = require('minimist');
const {dirname, join, normalize, relative} = require('path');
const { Transform } = require('stream');

module.exports = function (cliArgs = []) {
  const {action, exclude, include, showPrivate} = processArgs(cliArgs);

  const allPackages = findAllMonorepoPackages();
  const allPkgJsons = allPackages.map(path => readJsonSync(path));

  const filteredPkgJsons = filterPkgJsons(
    allPkgJsons,
    {action, exclude, include, showPrivate}
  );

  const pkgJsonDict = makePkgJsonDict(
    allPackages,
    allPkgJsons,
    filteredPkgJsons
  );

  switch (action) {
    case 'build:browser':
      buildBrowser(cliArgs.slice(1), pkgJsonDict);
      break;
    case 'build:node':
      buildNode(cliArgs.slice(1), pkgJsonDict);
      break;
    default:
      throw new Error(`no implementation for ${action} action`);
  }
};

function processArgs(cliArgs) {
  let options;
  if (process.env.EMBARK_COLLECTIVE_OPTIONS) {
    options = JSON.parse(process.env.EMBARK_COLLECTIVE_OPTIONS);
  } else {
    options = {};
  }

  const solo = !!process.env.EMBARK_SOLO;

  const args = minimist(cliArgs);

  Object.keys(args).forEach(key => {
    const invKey = key.slice(3);
    if (key.startsWith('no-') && args.hasOwnProperty(invKey)) {
      args[key] = !args[invKey];
      delete args[invKey];
    }
  });

  const np = 'no-private';
  args.ignore = [].concat(options.ignore || [], args.ignore || []);
  args[np] = !!options[np];
  args.scope = [].concat(options.scope || [], args.scope || []);
  if (!args._[0]) args._[0] = 'start';

  // scripts/monorun.js (in the monorepo root) forwards other `lerna run`
  // options as well, e.g. `stream` and `parallel`; for now only make use of
  // ignore, scope, and no-private; can consider implementing support for the
  // others if desirable/needed in the context of collective actions

  const {_: [action], ignore: exclude, [np]: noPrivate, scope: include} = args;
  const showPrivate = !noPrivate;

  return {action, exclude, include, showPrivate};
}

let _monorepoRootPath = null;
const lernaJson = 'lerna.json';
function monorepoRootPath() {
  if (_monorepoRootPath === null) {
    _monorepoRootPath = dirname(findUp(lernaJson, {cwd: __dirname}));
  }

  return _monorepoRootPath;
}

const globArgs = [
  '**/package.json',
  {
    cwd: monorepoRootPath(),
    ignore: [
      '**/node_modules/**',
      'package.json',
      'scripts/**',
      'site/**'
    ]
  }
];

function findAllMonorepoPackages() {
  return glob(...globArgs).map(path => join(monorepoRootPath(), path));
}

function filterPkgJsons(pkgJsons, {action, exclude, include, showPrivate}) {
  const embarkCollective = 'embark-collective';
  return filterPackages(
    pkgJsons,
    include,
    exclude,
    showPrivate
  ).filter(pkgJson => (
    pkgJson && pkgJson[embarkCollective] && pkgJson[embarkCollective][action] &&
      !(pkgJson.scripts && pkgJson.scripts[action])
  ));
}

function makePkgJsonDict(allPackages, allPkgJsons, filteredPkgJsons) {
  const allPkgJsonDict = {};
  const filteredPkgJsonDict = {};

  allPkgJsons.forEach(({name}, index) => {
    allPkgJsonDict[name] = allPackages[index];
  });

  filteredPkgJsons.forEach(({name}) => {
    filteredPkgJsonDict[name] = allPkgJsonDict[name];
  });

  return filteredPkgJsonDict;
}

function labeler(label) {
  return new Transform({
    transform(chunk, _encoding, callback) {
      chunk = Buffer.from(
        `[${label}] ${chunk.toString()}`
      );
      callback(null, chunk);
    }
  });
}

function build(babelEnv, outDir, cliArgs, pkgJsonDict) {
  const rootPath = monorepoRootPath();

  const babelCmd = process.platform === 'win32' ? 'babel.cmd': 'babel';
  const babelBinPath = join(__dirname, 'node_modules', '.bin', babelCmd);
  const babelConfigPath = join(rootPath, 'babel.config.js');

  const sources = Object.values(pkgJsonDict).map(
    path => relative(rootPath, join(dirname(path), 'src'))
  );

  if (!sources.length) {
    return;
  }

  process.chdir(rootPath);

  const subp = spawn(babelBinPath, [
    ...sources,
    '--config-file',
    babelConfigPath,
    '--extensions',
    '.js,.ts',
    '--out-dir',
    normalize(`../${outDir}`),
    '--relative',
    '--source-maps',
    ...cliArgs
  ], {
    env: {
      ...process.env,
      BABEL_ENV: babelEnv
    },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  subp.stdout.pipe(labeler(`build:${babelEnv}`)).pipe(process.stdout);
  subp.stderr.pipe(labeler(`build:${babelEnv}`)).pipe(process.stderr);
}

function buildBrowser(cliArgs, pkgJsonDict) {
  build('browser', 'dist/browser', cliArgs, pkgJsonDict);
}

function buildNode(cliArgs, pkgJsonDict) {
  build('node', 'dist', cliArgs, pkgJsonDict);
}

const embarkInsidePkg = 'embark-inside-monorepo';
try {
  require.resolve(embarkInsidePkg, {paths: [__dirname]});
} catch (err) {
  const dir = dirname(findUp('package.json', {cwd: __dirname}));
  throw new Error(`package at ${dir} is not inside embark's monorepo`);
}

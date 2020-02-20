const filterPackages = require('@lerna/filter-packages');
const {spawn} = require('child_process');
const {sync: findUp} = require('find-up');
const {existsSync, readJsonSync, writeJsonSync} = require('fs-extra');
const {sync: glob} = require('glob');
const isEqual = require('lodash.isequal');
const isPlainObject = require('lodash.isplainobject');
const mergeWith = require('lodash.mergewith');
const minimist = require('minimist');
const {basename, dirname, join, normalize, relative} = require('path');
const sortKeys = require('sort-keys');
const {Transform} = require('stream');

const EMBARK_COLLECTIVE = 'embark-collective';

module.exports = function (cliArgs = []) {
  const {action, exclude, include, showPrivate, solo} = processArgs(cliArgs);

  const allPackages = findAllMonorepoPackages();
  const allPkgJsons = allPackages.map(path => readJsonSync(path));

  const filteredPkgJsons = filterPkgJsons(
    allPkgJsons,
    {action, exclude, include, showPrivate}
  );

  const {allPkgJsonDict, filteredPkgJsonDict} = makePkgJsonDict(
    allPackages,
    allPkgJsons,
    filteredPkgJsons
  );

  switch (action) {
    case 'build:browser':
      buildBrowser(cliArgs.slice(1), filteredPkgJsonDict);
      break;
    case 'build:node':
      buildNode(cliArgs.slice(1), filteredPkgJsonDict);
      break;
    case 'typecheck':
      typecheck(cliArgs.slice(1), filteredPkgJsonDict, allPkgJsonDict, solo);
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
  const solo = !!process.env.EMBARK_SOLO;

  return {action, exclude, include, showPrivate, solo};
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
  return filterPackages(
    pkgJsons,
    include,
    exclude,
    showPrivate
  ).filter(pkgJson => (
    pkgJson && pkgJson[EMBARK_COLLECTIVE] && pkgJson[EMBARK_COLLECTIVE][action] &&
      !(pkgJson.scripts && pkgJson.scripts[action])
  ));
}

function makePkgJsonDict(allPackages, allPkgJsons, filteredPkgJsons) {
  const allPkgJsonDict = {};
  const filteredPkgJsonDict = {};

  allPkgJsons.forEach((pkgJson, index) => {
    const {name} = pkgJson;
    pkgJson._path = allPackages[index];
    allPkgJsonDict[name] = pkgJson;
  });

  filteredPkgJsons.forEach(({name}) => {
    filteredPkgJsonDict[name] = allPkgJsonDict[name];
  });

  return {allPkgJsonDict, filteredPkgJsonDict};
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
  const babelBinPath = join(rootPath, 'node_modules', '.bin', babelCmd);
  const babelConfigPath = join(rootPath, 'babel.config.js');

  const sources = Object.values(pkgJsonDict).map(
    ({_path}) => relative(rootPath, join(dirname(_path), 'src'))
  );

  if (!sources.length) {
    return;
  }

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
    cwd: rootPath,
    env: {
      ...process.env,
      BABEL_ENV: babelEnv,
      FORCE_COLOR: '1'
    },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  subp.stdout.pipe(labeler(`build:${babelEnv}`)).pipe(process.stdout);
  subp.stderr.pipe(labeler(`build:${babelEnv}`)).pipe(process.stderr);

  subp.on('close', code => process.exit(code));
}

function buildBrowser(cliArgs, pkgJsonDict) {
  build('browser', 'dist/browser', cliArgs, pkgJsonDict);
}

function buildNode(cliArgs, pkgJsonDict) {
  build('node', 'dist', cliArgs, pkgJsonDict);
}

function typecheck(cliArgs, filteredPkgJsonDict, allPkgJsonDict, solo) {
  let doClean = cliArgs.indexOf('--clean');
  if (doClean > -1) {
    cliArgs.splice(doClean, 1);
    doClean = true;
  } else {
    doClean = false;
  }

  const rootPath = monorepoRootPath();
  const rootTsConfigPath = join(rootPath, 'tsconfig.json');
  const baseTsConfigPath = join(rootPath, 'tsconfig.base.json');
  const collectiveTsConfigPath = join(rootPath, '.tsconfig.collective.json');
  const typecheckCmd = process.platform === 'win32' ? 'tsc.cmd': 'tsc';
  const typecheckBinPath = join(__dirname, '..', 'node_modules', '.bin', typecheckCmd);

  const allPkgNames = new Set(Object.keys(allPkgJsonDict));
  const seen = {};

  const collectiveTsConfig = {
    files: [],
    references: []
  };

  Object.values(filteredPkgJsonDict).forEach(pkgJson => {
    const packages = [pkgJson];
    for (const _pkgJson of packages) {
      if (seen[_pkgJson.name]) continue;
      seen[_pkgJson.name] = true;
      const pkgTsConfig = {
        compilerOptions: {
          composite: true,
          declarationDir: './dist',
          tsBuildInfoFile: `./node_modules/.cache/tsc/tsconfig.${_pkgJson.name}.tsbuildinfo`
        },
        extends: relative(
          dirname(_pkgJson._path),
          baseTsConfigPath
        ).replace(/\\/g, '/'),
        include: []
      };

      pkgTsConfig.compilerOptions.rootDir = './src';
      if (_pkgJson.main &&
          (basename(dirname(_pkgJson.main)) === 'lib' ||
           basename(dirname(dirname(_pkgJson.main))) === 'lib')) {
        pkgTsConfig.include.push('src/lib/**/*');
      } else {
        pkgTsConfig.include.push('src/**/*');
      }

      let refs;
      for (const pkgName of [
        ...new Set(
          [
            ...Object.keys(_pkgJson.dependencies),
            ...Object.keys(_pkgJson.devDependencies)
          ]
        )
      ].filter(n => n !== 'embark-solo')) {
        if (allPkgNames.has(pkgName)) {
          if (!refs) {
            refs = true;
            pkgTsConfig.references = [];
          }

          const depPkgJson = allPkgJsonDict[pkgName];
          const depPkgJsonTsConfig = (depPkgJson[EMBARK_COLLECTIVE] &&
                                      depPkgJson[EMBARK_COLLECTIVE].typecheck);

          if (depPkgJsonTsConfig) {
            pkgTsConfig.references.push({
              path: relative(
                dirname(_pkgJson._path),
                dirname(depPkgJson._path)
              ).replace(/\\/g, '/')
            });

            // eslint-disable-next-line max-depth
            if (!seen[pkgName]) {
              packages.push(depPkgJson);
            }
          }
        }
      }

      if (pkgTsConfig.references) {
        pkgTsConfig.references.sort(refPathSort);
      }

      const _pkgJsonTsConfig = _pkgJson[EMBARK_COLLECTIVE].typecheck;

      if (isPlainObject(_pkgJsonTsConfig)) {
        mergeWith(pkgTsConfig, _pkgJsonTsConfig, (_objValue, srcValue, key) => {
          // cf. https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
          if (['exclude', 'files', 'include'].includes(key)) {
            return srcValue;
          }
          return undefined;
        });
      }

      const pkgTsConfigPath = join(dirname(_pkgJson._path), 'tsconfig.json');

      if (!existsSync(pkgTsConfigPath) ||
          !isEqual(pkgTsConfig, readJsonSync(pkgTsConfigPath))) {
        writeJsonSync(
          pkgTsConfigPath,
          sortKeys(pkgTsConfig, {deep: true}),
          {spaces: 2}
        );
      }
    }
  });

  const rootTsConfig = {
    files: [],
    references: []
  };

  Object.values(allPkgJsonDict).forEach(pkgJson => {
    if (pkgJson[EMBARK_COLLECTIVE] && pkgJson[EMBARK_COLLECTIVE].typecheck) {
      rootTsConfig.references.push({
        path: relative(rootPath, dirname(pkgJson._path)).replace(/\\/g, '/')
      });
    }
  });

  rootTsConfig.references.sort(refPathSort);

  if (!existsSync(rootTsConfigPath) ||
      !isEqual(rootTsConfig, readJsonSync(rootTsConfigPath))) {
    writeJsonSync(
      rootTsConfigPath,
      sortKeys(rootTsConfig, {deep: true}),
      {spaces: 2}
    );
  }

  if (solo) {
    let packagePath = Object.values(filteredPkgJsonDict)[0];
    packagePath = packagePath && dirname(packagePath._path);
    if (!packagePath) {
      process.exit(0);
    }

    const doSolo = () => {
      const subp = spawn(typecheckBinPath, [
        '--build',
        '--pretty',
        ...cliArgs
      ], {
        cwd: packagePath,
        stdio: 'inherit'
      });

      subp.on('close', code => process.exit(code));
    };

    if (doClean) {
      const subp = spawn(typecheckBinPath, [
        '--build',
        '--clean'
      ], {
        cwd: packagePath,
        stdio: 'inherit'
      });

      subp.on('close', code => {
        if (code) process.exit(code);
        doSolo();
      });
    } else {
      doSolo();
    }
  } else {
    Object.values(filteredPkgJsonDict).forEach(pkgJson => {
      if (pkgJson[EMBARK_COLLECTIVE] && pkgJson[EMBARK_COLLECTIVE].typecheck) {
        collectiveTsConfig.references.push({
          path: relative(rootPath, dirname(pkgJson._path)).replace(/\\/g, '/')
        });
      }
    });

    collectiveTsConfig.references.sort(refPathSort);

    if (!existsSync(collectiveTsConfigPath) ||
        !isEqual(collectiveTsConfig, readJsonSync(collectiveTsConfigPath))) {
      writeJsonSync(
        collectiveTsConfigPath,
        sortKeys(collectiveTsConfig, {deep: true}),
        {spaces: 2}
      );
    }

    const doCollective = () => {
      const subp = spawn(typecheckBinPath, [
        '--build',
        collectiveTsConfigPath,
        '--pretty',
        ...cliArgs
      ], {
        cwd: rootPath,
        stdio: ['inherit', 'pipe', 'pipe']
      });

      subp.stdout.pipe(labeler('typecheck')).pipe(process.stdout);
      subp.stderr.pipe(labeler('typecheck')).pipe(process.stderr);

      subp.on('close', code => process.exit(code));
    };

    if (doClean) {
      const subp = spawn(typecheckBinPath, [
        '--build',
        collectiveTsConfigPath,
        '--clean'
      ], {
        cwd: rootPath,
        stdio: ['inherit', 'pipe', 'pipe']
      });

      subp.stdout.pipe(labeler('typecheck')).pipe(process.stdout);
      subp.stderr.pipe(labeler('typecheck')).pipe(process.stderr);

      subp.on('close', code => {
        if (code) process.exit(code);
        doCollective();
      });
    } else {
      doCollective();
    }
  }
}

function refPathSort({path: pathA}, {path: pathB}) {
  if (pathA < pathB) {
    return -1;
  } else if (pathA > pathB) {
    return 1;
  }
  return 0;
}

const embarkInsidePkg = 'embark-inside-monorepo';
try {
  require.resolve(embarkInsidePkg, {paths: [__dirname]});
} catch (err) {
  const dir = dirname(findUp('package.json', {cwd: __dirname}));
  throw new Error(`package at ${dir} is not inside embark's monorepo`);
}

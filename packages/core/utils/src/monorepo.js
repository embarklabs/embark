const findUp = require('find-up');
const {readJson, readJsonSync} = require('fs-extra');

const {promisify} = require('util');
const glob = require('glob');
const globP = promisify(glob);

const {basename, dirname, join} = require('path');

let _isInsideMonorepo = null;
let _monorepoRootPath = null;

const embarkInsidePkg = 'embark-inside-monorepo';
const lernaJson = 'lerna.json';

const couldNotFindRootErrorMsg = `could not find embark's monorepo's root starting from ${__dirname}`;
const notInsideErrorMsg = function (dir) {
  return `package ${dir} is not inside embark's monorepo`;
};

async function isInsideMonorepo() {
  if (_isInsideMonorepo === null) {
    try {
      _isInsideMonorepo = !!(
        await findUp(`node_modules/${embarkInsidePkg}`, {cwd: __dirname})
      );
    } catch (err) {
      _isInsideMonorepo = false;
    }
  }

  return _isInsideMonorepo;
}

function isInsideMonorepoSync() {
  if (_isInsideMonorepo === null) {
    try {
      _isInsideMonorepo = !!require.resolve(
        embarkInsidePkg, {paths: [__dirname]}
      );
    } catch (err) {
      _isInsideMonorepo = false;
    }
  }

  return _isInsideMonorepo;
}

async function monorepoRootPath() {
  if (!(await isInsideMonorepo())) {
    throw new Error(
      notInsideErrorMsg(dirname(await findUp('package.json', {cwd: __dirname})))
    );
  }

  if (_monorepoRootPath === null) {
    try {
      _monorepoRootPath = dirname(await findUp(lernaJson, {cwd: __dirname}));
    } catch (err) {
      _monorepoRootPath = false;
      throw new Error(couldNotFindRootErrorMsg);
    }
  }

  if (_monorepoRootPath) {
    return _monorepoRootPath;
  }

  throw new Error(couldNotFindRootErrorMsg);
}

function monorepoRootPathSync() {
  if (!isInsideMonorepoSync()) {
    throw new Error(
      notInsideErrorMsg(dirname(findUp.sync('package.json', {cwd: __dirname})))
    );
  }

  if (_monorepoRootPath === null) {
    try {
      _monorepoRootPath = dirname(findUp.sync(lernaJson, {cwd: __dirname}));
    } catch (err) {
      _monorepoRootPath = false;
      throw new Error(couldNotFindRootErrorMsg);
    }
  }

  if (_monorepoRootPath) {
    return _monorepoRootPath;
  }

  throw new Error(couldNotFindRootErrorMsg);
}

const globArgs = function(monorepoRootPath) {
  return [
    '**/package.json',
    {
      cwd: monorepoRootPath,
      ignore: [
        '**/node_modules/**',
        'package.json',
        'scripts/**',
        'site/**'
      ]
    }
  ];
};

const couldNotFindPkgErrorMsg = function(pkgName, monorepoRootPath) {
  return `could not find any package named ${pkgName} inside the embark monorepo at ${monorepoRootPath}, if it is known to exist try disabling the prefilter by passing null as the second argument`;
};

const partialMatch = function(pkgName) {
  if (pkgName.startsWith('embark-')) {
    pkgName = pkgName.slice(7);
  }
  return function (pkgJsonPath) {
    let dir = basename(dirname(pkgJsonPath));
    return dir.includes(pkgName);
  };
};

async function findMonorepoPackageFromRoot(pkgName, prefilter = partialMatch) {
  const rootPath = await monorepoRootPath();
  const pkgJsonPaths = (await globP(...globArgs(rootPath)));

  prefilter = prefilter ? prefilter(pkgName) : () => true;
  const jsons = function *() {
    for (let path of pkgJsonPaths) {
      if (!prefilter(path)) continue;
      path = join(rootPath, path);
      yield Promise.all([readJson(path), path]);
    }
  };

  let pkgPath;
  for await (const [json, path] of jsons()) {
    if (json.name === pkgName) {
      pkgPath = dirname(path);
      break;
    }
  }

  if (pkgPath) return pkgPath;

  throw new Error(couldNotFindPkgErrorMsg(pkgName, rootPath));
}

function findMonorepoPackageFromRootSync(pkgName, prefilter = partialMatch) {
  const rootPath = monorepoRootPathSync();
  const pkgJsonPaths = glob.sync(...globArgs(rootPath));

  prefilter = prefilter ? prefilter(pkgName) : () => true;
  const jsons = function *() {
    for (let path of pkgJsonPaths) {
      if (!prefilter(path)) continue;
      path = join(rootPath, path);
      yield [readJsonSync(path), path];
    }
  };

  let pkgPath;
  for (const [json, path] of jsons()) {
    if (json.name === pkgName) {
      pkgPath = dirname(path);
      break;
    }
  }

  if (pkgPath) return pkgPath;

  throw new Error(couldNotFindPkgErrorMsg(pkgName, rootPath));
}

module.exports = {
  findMonorepoPackageFromRoot,
  findMonorepoPackageFromRootSync,
  isInsideMonorepo,
  isInsideMonorepoSync,
  monorepoRootPath,
  monorepoRootPathSync
};

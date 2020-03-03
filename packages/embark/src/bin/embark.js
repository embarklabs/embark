// This script doesn't use JS syntax, packages, or APIs *un*supported by any
// node version >=4.0.0, so unsupported versions from v4.0.0+ will get the
// intended error messages. A future version of this script could instead rely
// on babel to achieve the same goal.
// See: https://node.green/

// KEY ASSUMPTION: for a DApp to be valid, from embark's cli's perspective, it
// must have an importable embark.config.js file or a parsable embark.json file
// in its top-level directory; if that requirement changes in the future then
// this script must be revised. Hypothetical example of such a change: embark
// config info may be included in package.json under `{"embark": {...}}` -or-
// stored in a config file.

function main() {
  if (whenNoShim()) return;
  var invoked = thisEmbark();
  var embarkConfig = findEmbarkConfig();
  var dappPath = embarkConfig.dirname;
  process.chdir(dappPath);
  process.env.DAPP_PATH = dappPath;
  process.env.PWD = dappPath;

  /* attempt to find a "local" embark in or above but not below dappPath

     let `dappPath/(([../])*)bin/embark` be a "containing" embark

     let `dappPath/(([../])*)node_modules/embark/bin/embark` be an "installed"
     embark

     if containing and installed embarks are both found, and if containing
     embark is higher in the dir structure than installed embark, then
     containing embark will be selected

     according to the rule above: if an installed embark is found within a
     containing embark's own node_modules (that would be odd), installed embark
     will be selected

     invoked embark may find itself as local embark, but that is detected by
     comparing `binrealpath` props to avoid double-checking and infinite loops

     if no local embark is found then cmd execution will use invoked embark */

  var containing = findBinContaining(dappPath, invoked);
  var installed = findBinInstalled(dappPath, invoked);
  var local = selectLocal(containing, installed, invoked);
  var pkgJson = findPkgJson(dappPath, embarkConfig, local);
  process.env.PKG_PATH = pkgJson.dirname;
  var embark = select(invoked, local);
  process.env.EMBARK_PATH = embark.pkgDir;
  embark.exec(embarkConfig);
}

// -----------------------------------------------------------------------------

var checkDeps = require('../lib/utils/checkDependencies');
var npmlog = require('npmlog');
var findUp = require('find-up');
var fs = require('fs');
var path = require('path');
var parseJsonWithErrors = require('json-parse-better-errors');
var pkgUp = require('pkg-up');
var semver = require('semver');
var subdir = function (pdir_, dir_) {
  var pdir = path.resolve(path.normalize(pdir_)) + (path.sep || '/');
  var dir = path.resolve(pdir, path.normalize(dir_));
  if (pdir === '//') pdir = '/';
  if (pdir === dir) return false;
  return dir.slice(0, pdir.length) === pdir;
};

// -- embark bins --------------------------------------------------------------

function EmbarkBin(binpath, kind) {
  this.binpath = binpath;
  this.binrealpath = undefined;
  this.kind = kind || 'invoked';
  this.pkgDir = undefined;
  this.pkgJson = undefined;
}

EmbarkBin.prototype.exec = function (embarkConfig) {
  if (!embarkConfig) {
    embarkConfig = findEmbarkConfig();
    var dappPath = embarkConfig.dirname;
    process.chdir(dappPath);
    process.env.DAPP_PATH = dappPath;
    process.env.PWD = dappPath;
  }
  var Cmd = require('../cmd/cmd');
  var embarkBin = this;
  Promise.resolve(embarkConfig.contents)
    .then(function (embarkConfig) {
      try {
        var cli = new Cmd({embarkConfig});
        if(_logged) { console[embarkBin.loglevel](); }
        cli.process(process.argv);
      } catch (e) {
        reportUnhandledCliException(e);
        exitWithError();
      }
    })
    .catch(function (e) {
      reportConfigRejected(embarkConfig.filepath, e);
      exitWithError();
    });
};

EmbarkBin.prototype.handle = function () {
  this.setup();
  this.log();
  return this;
};

EmbarkBin.prototype.log = function () {
  this.logMissingBin();
  this.pkgJson.log();
};

EmbarkBin.prototype.loglevel = 'info';

EmbarkBin.prototype.logMissingBin = function () {
  var oldlevel = this.loglevel;
  this.loglevel = 'error';
  if (!this.binrealpath) {
    reportMissingFile_EmbarkBin(this.binpath, this.kind, this.loglevel);
    exitWithError();
  }
  this.loglevel = oldlevel;
};

EmbarkBin.prototype.setBinrealpath = function () {
  if (this.binpath) {
    this.binrealpath = realpath(this.binpath);
  }
};

EmbarkBin.prototype.setPkgDir = function () {
  if (this.binpath) {
    this.pkgDir = path.join(path.dirname(this.binpath), '..');
  }
};

EmbarkBin.prototype.setPkgJson = function () {
  if (this.binrealpath) {
    this.pkgJson = (
      new PkgJsonEmbark(
        path.join(this.pkgDir, 'package.json'),
        this.kind
      )
    );
    var upNodeModules = findUp.sync(
      'node_modules',
      {cwd: path.join(path.dirname(this.binrealpath), '../..')}
    );
    this.pkgJson.noCheck = (
      upNodeModules ? subdir(upNodeModules, this.binrealpath) : false
    );
    this.pkgJson.setup();
  }
};

EmbarkBin.prototype.setup = function () {
  this.setBinrealpath();
  this.setPkgDir();
  this.setPkgJson();
  return this;
};

// -- bin/embark :: local ------------------------------------------------------

function EmbarkBinLocal(binpath, invokedEmbark) {
  EmbarkBin.call(this, binpath, 'local');
  this.invokedEmbark = invokedEmbark;
}
setupProto(EmbarkBinLocal, EmbarkBin);

EmbarkBinLocal.prototype.exec = function () {
  process.argv[1] = this.binpath;
  process.env.EMBARK_NO_SHIM = true;
  console[this.loglevel]();
  require(this.binpath);
};

EmbarkBinLocal.prototype.log = function () {
  if (this.binrealpath !== this.invokedEmbark.binrealpath) {
    this.logSwitching();
    EmbarkBin.prototype.log.call(this);
  }
};

EmbarkBinLocal.prototype.logSwitching = function () {
  reportSwitching(
    this.invokedEmbark.binpath,
    this.binpath,
    this.loglevel,
    this.invokedEmbark.pkgJson.pkg,
    this.pkgJson.pkg
  );
};

EmbarkBinLocal.prototype.setup = function () {
  this.setBinrealpath();
  this.setPkgDir();
  if (this.binrealpath !== this.invokedEmbark.binrealpath) {
    this.setPkgJson();
  }
  return this;
};

// -- bin/embark :: local containing -------------------------------------------

function EmbarkBinLocalContaining(binpath, invokedEmbark) {
  EmbarkBinLocal.call(this, binpath, invokedEmbark);
}
setupProto(EmbarkBinLocalContaining, EmbarkBinLocal);

EmbarkBinLocalContaining.prototype.setPkgJson = function () {
  if (this.binrealpath) {
    this.pkgJson = (
      new PkgJsonEmbark(
        path.join(this.pkgDir, 'package.json'),
        this.kind
      )
    );
    this.pkgJson.noCheck = false;
    this.pkgJson.setup();
  }
};

// -- bin/embark :: local installed --------------------------------------------

function EmbarkBinLocalInstalled(binpath, invokedEmbark) {
  EmbarkBinLocal.call(this, binpath, invokedEmbark);
}
setupProto(EmbarkBinLocalInstalled, EmbarkBinLocal);

EmbarkBinLocalInstalled.prototype.log = function () {
  EmbarkBinLocal.prototype.log.call(this);
  this.pkgJsonLocalExpected.log();
};

EmbarkBinLocalInstalled.prototype.setPkgJson = function () {
  if (this.binrealpath) {
    this.pkgJson = (
      new PkgJsonEmbark(
        path.join(this.pkgDir, 'package.json'),
        this.kind
      )
    ).setup();
  }
};

EmbarkBinLocalInstalled.prototype.setPkgJsonLocalExpected = function () {
  if (this.binrealpath) {
    this.pkgJsonLocalExpected = (
      new PkgJsonLocalExpected(path.join(this.pkgDir, '../../package.json'))
    ).setup();
  }
};

EmbarkBinLocalInstalled.prototype.setup = function () {
  EmbarkBinLocal.prototype.setup.call(this);
  this.setPkgJsonLocalExpected();
  return this;
};

// -- finders ------------------------------------------------------------------

function findBin(dappPath, find, invoked, Kind) {
  return (
    new Kind(
      findUp.sync(find, {cwd: dappPath}),
      invoked
    )
  ).setup();
}

function findBinContaining(dappPath, invoked) {
  return findBin(
    dappPath,
    'bin/embark',
    invoked,
    EmbarkBinLocalContaining
  );
}

function findBinInstalled(dappPath, invoked) {
  return findBin(
    dappPath,
    'node_modules/embark/bin/embark',
    invoked,
    EmbarkBinLocalInstalled
  );
}

function findEmbarkConfig() {
  // findUp search begins in process.cwd() by default, but the config could be
  // in a subdir if embark was invoked via `npm run` (which changes cwd to
  // package.json's dir) and the package.json is in a dir above the top-level
  // DApp dir; so start at INIT_CWD if that has been set (by npm, presumably)
  // See: https://docs.npmjs.com/cli/run-script
  var cmd = process.argv[2];
  var embarkConfig, embarkConfigJsPath, embarkJsonPath;
  var startDir = initCwd();
  embarkConfigJsPath = findUp.sync('embark.config.js', {cwd: startDir});
  if (embarkConfigJsPath) {
    embarkConfig = new EmbarkConfig(
      (new EmbarkConfigJs(embarkConfigJsPath, cmd)).handle()
    );
  } else {
    embarkJsonPath = findUp.sync('embark.json', {cwd: startDir});
    if (embarkJsonPath) {
      embarkConfig = new EmbarkConfig(
        (new EmbarkJson(embarkJsonPath, cmd)).handle()
      );
    }
  }
  if (!embarkConfig) {
    embarkConfig = new EmbarkConfig(
      (new EmbarkConfigJs(
        path.join(startDir, 'embark.config.js'), cmd)
      ).handle()
    );
  }
  return embarkConfig.handle();
}

function findPkgJson(dappPath, embarkConfig, local) {
  var skipDirs = [];
  if (local) {
    if (local instanceof EmbarkBinLocalContaining) {
      skipDirs.push(local.pkgDir);
    }
    if (local instanceof EmbarkBinLocalInstalled) {
      skipDirs.push(local.pkgJsonLocalExpected.dirname);
    }
  }
  var closest, dir, found;
  var startDir = dappPath;

  /* let `dappPath/(([../])*)package.json` be a "local" package.json */

  // look for local package.json files starting from dappPath
  function stop() {
    found = pkgUp.sync(startDir);
    if (found && !closest) {
      closest = found;
    }
    dir = found ? path.dirname(found) : found;
    var stop = !dir || !isDappCmd(embarkConfig.cmd);
    if (!stop) {
      startDir = path.join(dir, '..');
    }
    return stop;
  }
  while (!stop()) {
    if (skipDirs.indexOf(dir) === -1) {
      (new PkgJsonLocal(found)).handle();
    }
  }
  if (isDappCmd(embarkConfig.cmd) && !closest) {
    var loglevel = 'error';
    reportMissingFile(path.join(dappPath, 'package.json'), loglevel);
    reportMissingFile_DappJson(embarkConfig.cmd, loglevel, 'package', 'in or above');
    exitWithError();
  }
  return (
    closest || (new PkgJsonLocal(path.join(startDir, 'package.json'))).setup()
  );
}

// -- generic config -----------------------------------------------------------

function EmbarkConfig(configFile) {
  this.configFile = configFile;
  this.filepath = configFile.filepath;
  this.cmd = configFile.cmd;
  this.dirname = configFile.dirname;
  this.realpath = configFile.realpath;
  this.callError = undefined;
  this.contents = undefined;
}

EmbarkConfig.prototype.handle = function () {
  this.setup();
  this.log();
  return this;
};

EmbarkConfig.prototype.log = function () {
  this.logMissingConfig();
  this.logCallFailed();
};

EmbarkConfig.prototype.loglevel = 'error';

EmbarkConfig.prototype.logCallFailed = function () {
  if (isDappCmd(this.cmd) && this.realpath && this.callError) {
    reportCallFailed(this.filepath, this.callError, this.loglevel);
    exitWithError();
  }
};

EmbarkConfig.prototype.logMissingConfig = function () {
  if (isDappCmd(this.cmd) && !this.realpath) {
    reportMissingConfig(this.cmd, this.loglevel);
    exitWithError();
  }
};

EmbarkConfig.prototype.setContents = function () {
  if (isDappCmd(this.cmd) && this.realpath) {
    if (this.configFile instanceof EmbarkConfigJs) {
      this.contents = this.configFile.exports;
      if (typeof this.contents === 'function') {
        try {
          this.contents = this.contents();
        } catch (e) {
          this.contents = undefined;
          this.callError = e;
        }
      }
    } else if (this.configFile instanceof EmbarkJson) {
      this.contents = this.configFile.json;
    }
  }
};

EmbarkConfig.prototype.setup = function () {
  this.setContents();
  return this;
};

// -- js config file -----------------------------------------------------------

function EmbarkConfigJs(filepath, cmd) {
  this.filepath = filepath;
  this.cmd = cmd;
  this.dirname = undefined;
  this.exports = undefined;
  this.importError = undefined;
  this.realpath = undefined;
}

EmbarkConfigJs.prototype.handle = function () {
  this.setup();
  this.log();
  return this;
};

EmbarkConfigJs.prototype.log = function () {
  this.logUnimportable();
};

EmbarkConfigJs.prototype.loglevel = 'error';

EmbarkConfigJs.prototype.logUnimportable = function () {
  if (isDappCmd(this.cmd) && this.realpath && this.importError) {
    reportUnimportable(this.filepath, this.importError, this.loglevel);
    exitWithError();
  }
};

EmbarkConfigJs.prototype.setDirname = function () {
  if (this.filepath) {
    this.dirname = path.dirname(this.filepath);
  }
};

EmbarkConfigJs.prototype.setExports = function () {
  if (isDappCmd(this.cmd) && this.realpath) {
    try {
      this.exports = require(this.filepath);
    } catch (e) {
      this.exports = undefined;
      this.importError = e;
    }
  }
};

EmbarkConfigJs.prototype.setRealpath = function () {
  if (this.filepath) {
    this.realpath = realpath(this.filepath);
  }
};

EmbarkConfigJs.prototype.setup = function () {
  this.setDirname();
  this.setRealpath();
  this.setExports();
  return this;
};

// -- json files ---------------------------------------------------------------

function Json(filepath) {
  this.filepath = filepath;
  this.dirname = undefined;
  this.json = undefined;
  this.realpath = undefined;
}

Json.prototype.handle = function () {
  this.setup();
  this.log();
  return this;
};

Json.prototype.log = function () {
  this.logMissingFile();
  this.logUnparsable();
};

Json.prototype.loglevel = 'warn';

Json.prototype.logMissingFile = function () {
  var missing;
  if (!this.realpath) {
    missing = true;
    reportMissingFile(this.filepath, this.loglevel);
  }
  return missing;
};

Json.prototype.logUnparsable = function () {
  var unparsable;
  if (this.realpath && !this.json) {
    unparsable = true;
    reportUnparsable(this.filepath, this.loglevel);
  }
  return unparsable;
};

Json.prototype.setDirname = function () {
  if (this.filepath) {
    this.dirname = path.dirname(this.filepath);
  }
};

Json.prototype.setJson = function () {
  if (this.realpath) {
    this.json = parseJson(this.filepath);
  }
};

Json.prototype.setRealpath = function () {
  if (this.filepath) {
    this.realpath = realpath(this.filepath);
  }
};

Json.prototype.setup = function () {
  this.setDirname();
  this.setRealpath();
  this.setJson();
  return this;
};

// -- embark.json --------------------------------------------------------------

function EmbarkJson(filepath, cmd) {
  Json.call(this, filepath);
  this.cmd = cmd;
}
setupProto(EmbarkJson, Json);

EmbarkJson.prototype.loglevel = 'error';

EmbarkJson.prototype.log = function () {
  this.logUnparsable();
};

EmbarkJson.prototype.logUnparsable = function () {
  if (isDappCmd(this.cmd) && Json.prototype.logUnparsable.call(this)) {
    reportUnparsable_EmbarkJson(this.loglevel);
    exitWithError();
  }
};

// -- package.json -------------------------------------------------------------

function PkgJson(filepath) {
  Json.call(this, filepath);
}
setupProto(PkgJson, Json);

PkgJson.prototype.log = function () {
  Json.prototype.log.call(this);
  this.logPkgErrors();
};

PkgJson.prototype.logPkgErrors = function () {
  var pkgErrors;
  if (this.json && !this.noCheck) {
    pkgErrors = checkPkg(this.dirname);
  }
  if (pkgErrors) {
    reportPkgErrors(pkgErrors, this.filepath, this.loglevel);
  }
  return !!pkgErrors;
};

PkgJson.prototype.noCheck = false;

// -- package.json :: of an embark pkg -----------------------------------------

function PkgJsonEmbark(filepath, kind) {
  PkgJson.call(this, filepath);
  this.kind = kind || 'invoked';
  this.nodeRange = undefined;
  this.pkg = undefined;
  this.version = undefined;
}
setupProto(PkgJsonEmbark, PkgJson);

PkgJsonEmbark.prototype.log = function () {
  PkgJson.prototype.log.call(this);
  this.logMissingVersion();
  this.logUnsupportedNode();
};

PkgJsonEmbark.prototype.loglevel = 'error';

PkgJsonEmbark.prototype.logMissingFile = function () {
  if (PkgJson.prototype.logMissingFile.call(this)) {
    reportMissingFile_PkgJsonEmbark(this.kind, this.loglevel);
    exitWithError();
  }
};

PkgJsonEmbark.prototype.logMissingVersion = function () {
  var missing;
  var oldlevel = this.loglevel;
  this.loglevel = 'warn';
  if (this.json && this.version === '???') {
    missing = true;
    reportMissingVersion(this.filepath, this.kind, this.loglevel);
  }
  this.loglevel = oldlevel;
  return missing;
};

PkgJsonEmbark.prototype.logPkgErrors = function () {
  if (PkgJson.prototype.logPkgErrors.call(this)) {
    reportPkgErrors_PkgJsonEmbark(this.dirname, this.kind, this.loglevel);
    exitWithError();
  }
};

PkgJsonEmbark.prototype.logUnparsable = function () {
  if (PkgJson.prototype.logUnparsable.call(this)) {
    reportUnparsable_PkgJsonEmbark(this.kind, this.loglevel);
    exitWithError();
  }
};

PkgJsonEmbark.prototype.logUnsupportedNode = function () {
  var missing;
  var range = this.nodeRange;
  if (typeof range === 'undefined') {
    missing = true;
    range = this.nodeRangeDefault;
  }
  var bad;
  range = parseRange(range);
  if (!range) {
    bad = true;
    range = this.nodeRangeDefault;
  }
  var procVer = semver.clean(process.version);
  this.loglevel = 'error';
  if (!semver.satisfies(procVer, range)) {
    reportUnsupportedNode(
      bad,
      this.filepath,
      this.kind,
      this.loglevel,
      missing,
      this.nodeRangeDefault,
      this.nodeRange,
      this.pkg,
      procVer,
      range
    );
    exitWithError();
  }
};

PkgJsonEmbark.prototype.noCheck = true;

// if changing to the `nodeRangeDefault` value, make sure to manually check
// that it's a valid semver range, otherwise fallback logic in the prototype
// methods won't be reliable
PkgJsonEmbark.prototype.nodeRangeDefault = semver.Range('>=10.17.0').range;

PkgJsonEmbark.prototype.setNodeRange = function () {
  if (isObject(this.json) &&
      this.json.hasOwnProperty('runtime') &&
      this.json.runtime.hasOwnProperty('engines') &&
      this.json.runtime.engines.hasOwnProperty('node')) {
    this.nodeRange = this.json.runtime.engines.node;
  }
};

PkgJsonEmbark.prototype.setPkg = function () {
  this.pkg = `embark@${this.version}`;
};

PkgJsonEmbark.prototype.setVersion = function () {
  if (isObject(this.json) && this.json.version) {
    this.version = this.json.version;
  } else {
    this.version = '???';
  }
};

PkgJsonEmbark.prototype.setup = function () {
  PkgJson.prototype.setup.call(this);
  this.setVersion();
  this.setPkg();
  this.setNodeRange();
  return this;
};

// -- package.json :: local to DApp --------------------------------------------

function PkgJsonLocal(filepath) {
  PkgJson.call(this, filepath);
}
setupProto(PkgJsonLocal, PkgJson);

PkgJsonLocal.prototype.loglevel = 'error';

PkgJsonLocal.prototype.logMissingFile = function () {
  if (PkgJson.prototype.logMissingFile.call(this)) {
    reportMissingFile_PkgJsonLocal(this.loglevel);
    exitWithError();
  }
};

PkgJsonLocal.prototype.logPkgErrors = function () {
  if (PkgJson.prototype.logPkgErrors.call(this)) {
    reportPkgErrors_PkgJsonLocal(this.dirname, this.loglevel);
    exitWithError();
  }
};

PkgJsonLocal.prototype.logUnparsable = function () {
  if (PkgJson.prototype.logUnparsable.call(this)) {
    reportUnparsable_PkgJsonLocal(this.loglevel);
    exitWithError();
  }
};

// -- package.json :: local to DApp, expected by local installed embark --------

function PkgJsonLocalExpected(filepath) {
  PkgJsonLocal.call(this, filepath);
  this.embarkDep = undefined;
}
setupProto(PkgJsonLocalExpected, PkgJsonLocal);

PkgJsonLocalExpected.prototype.log = function () {
  PkgJsonLocal.prototype.log.call(this);
  this.logMissingEmbarkDep();
};

PkgJsonLocalExpected.prototype.logMissingEmbarkDep = function () {
  if (this.json && !this.embarkDep) {
    reportMissingEmbarkDep(this.filepath, this.dirname, this.loglevel);
    exitWithError();
  }
};

PkgJsonLocalExpected.prototype.logMissingFile = function () {
  // PkgJson.prototype NOT PkgJsonLocal.prototype
  if (PkgJson.prototype.logMissingFile.call(this)) {
    reportMissingFile_PkgJsonLocalExpected(this.dirname, this.loglevel);
    exitWithError();
  }
};

PkgJsonLocalExpected.prototype.setEmbarkDep = function () {
  if (isObject(this.json)) {
    if (this.json.dependencies && this.json.dependencies.embark) {
      this.embarkDep = this.json.dependencies.embark;
    } else if (this.json.devDependencies && this.json.devDependencies.embark) {
      this.embarkDep = this.json.devDependencies.embark;
    }
  }
};

PkgJsonLocalExpected.prototype.setup = function () {
  PkgJsonLocal.prototype.setup.call(this);
  this.setEmbarkDep();
  return this;
};

// -- loggers ------------------------------------------------------------------

var embarklog = npmlog;
embarklog.heading = 'embark';

var _logged = false;
function logged(which) {
  var embarklog_which = embarklog[which];
  return function () {
    _logged = true;
    embarklog_which.apply(embarklog, arguments);
  };
}

embarklog.error = logged('error');
embarklog.info = logged('info');
embarklog.warn = logged('warn');

function blankLineMaybe(which) {
  if (_logged) {
    console[which]();
  }
}

var isNpmRun = process.env.hasOwnProperty('npm_lifecycle_script');
function blankLineTrailingMaybe(which) {
  if (isNpmRun) {
    console[which]();
  }
}

// -- processors ---------------------------------------------------------------

function checkPkg(pkgDir, scopes) {
  var errors;
  try {
    var config = {packageDir: pkgDir};
    if (scopes) {
      config.scopeList = scopes;
    }
    var checked = checkDeps.sync(config);
    if (checked.error.length) {
      errors = checked.error;
    }
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return errors;
  }
}

function parseJson(filepath) {
  var parsed;
  try {
    parsed = require(filepath);
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return parsed;
  }
}

function parseRange(range) {
  var parsed;
  try {
    parsed = semver.Range(range).range;
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return parsed;
  }
}

function realpath(filepath) {
  var resolved;
  try {
    resolved = fs.realpathSync(filepath);
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return resolved;
  }
}

function thisEmbark() {
  return (new EmbarkBin(path.join(__dirname, '../../bin/embark'))).handle();
}

function whenNoShim() {
  var noShim = !!process.env.EMBARK_NO_SHIM;
  if (noShim) EmbarkBin.prototype.exec();
  return noShim;
}

// -- reporters ----------------------------------------------------------------

function reportCallFailed(filepath, error, loglevel) {
  var basename = path.basename(filepath);
  blankLineMaybe(loglevel);
  embarklog[loglevel]('file', filepath);
  if (error.code) embarklog[loglevel]('code', error.code);
  embarklog[loglevel](
    'exports',
    `An exception was thrown when calling the function exported by ${basename}`
  );
  embarklog[loglevel]('', error.stack);
}

function reportConfigRejected(filepath, error, loglevel) {
  if (!loglevel) loglevel = 'error';
  var basename = path.basename(filepath);
  blankLineMaybe(loglevel);
  embarklog[loglevel]('file', filepath);
  if (error.code) embarklog[loglevel]('code', error.code);
  embarklog[loglevel](
    'exports',
    `Promise rejection when resolving the configuration from ${basename}`
  );
  embarklog[loglevel]('', error.stack);
}

function reportMissingConfig(cmd, loglevel) {
  blankLineMaybe(loglevel);
  embarklog[loglevel](
    '',
    `Could not locate your DApp's embark.config.js or embark.json file`
  );
  embarklog[loglevel](
    '',
    'Run `embark init` to generate an embark.json file automatically'
  );
}

function reportMissingEmbarkDep(filepath, dirname, loglevel) {
  blankLineMaybe(loglevel);
  embarklog[loglevel]('file', filepath);
  embarklog[loglevel](
    '',
    [
      `Could not find embark specified in "dependencies" or "devDependencies" of local package.json file`,
      `But embark was found in node_modules relative to that file:`,
      `${dirname}/node_modules/embark/`
    ].join('\n')
  );
}

function reportMissingFile(filepath, loglevel) {
  try {
    // force the exception
    fs.realpathSync(filepath);
  } catch (e) {
    blankLineMaybe(loglevel);
    embarklog[loglevel]('path', e.path);
    embarklog[loglevel]('code', e.code);
    embarklog[loglevel]('errno', e.errno);
    embarklog[loglevel]('syscall', e.syscall);
    embarklog[loglevel](e.code.toLowerCase(), e.message);
  }
}

function reportMissingFile_DappJson(cmd, loglevel, kind, where) {
  blankLineMaybe(loglevel);
  embarklog[loglevel](
    '',
    `Could not locate your DApp's ${kind}.json file`
  );
  embarklog[loglevel](
    '',
    `Make sure a valid ${kind}.json file exists ${where} your DApp's top-level directory`
  );
  embarklog[loglevel](
    '',
    `Embark command '${cmd}' can only be used inside a valid DApp directory structure`
  );
}

function reportMissingFile_EmbarkBin(binpath, kind, loglevel) {
  reportMissingFile(binpath, loglevel);
  console[loglevel]();
  embarklog[loglevel](
    '',
    [
      `Could not resolve ${kind} embark command path with require('fs').realpathSync`,
      `Maybe a broken symbolic link?`
    ].join('\n')
  );
}

function reportMissingFile_PkgJsonEmbark(kind, loglevel) {
  console[loglevel]();
  embarklog[loglevel](
    '',
    `Could not locate ${kind} embark's package.json file`
  );
}

function reportMissingFile_PkgJsonLocal(loglevel) {
  console[loglevel]();
  embarklog[loglevel](
    '',
    [
      `Could not resolve local package.json path with require('fs').realpathSync`,
      `Maybe a broken symbolic link?`
    ].join('\n')
  );
}

function reportMissingFile_PkgJsonLocalExpected(dirname, loglevel) {
  console[loglevel]();
  embarklog[loglevel](
    '',
    [
      `Could not find expected local package.json relative to embark found in:`,
      `${dirname}/node_modules/embark/`
    ].join('\n')
  );
}

function reportMissingVersion(filepath, kind, loglevel) {
  blankLineMaybe(loglevel);
  embarklog[loglevel]('file', filepath);
  embarklog[loglevel](
    '',
    `No version is specified in ${kind} embark's package.json file`
  );
}

function reportPkgErrors(errors, filepath, loglevel) {
  blankLineMaybe(loglevel);
  embarklog[loglevel]('file', filepath);
  embarklog[loglevel]('code', `EPKGCHK`);
  embarklog[loglevel]('package', errors.join('\n'));
}

function reportPkgErrors_PkgJsonEmbark(dirname, kind, loglevel) {
  console[loglevel]();
  embarklog[loglevel](
    '',
    [
      `Dependencies are missing relative to ${kind} embark's package.json in:`,
      `${dirname}/`
    ].join('\n')
  );
}

function reportPkgErrors_PkgJsonLocal(dirname, loglevel) {
  console[loglevel]();
  embarklog[loglevel](
    '',
    [
      `Dependencies are missing relative to local package.json in:`,
      `${dirname}/`
    ].join('\n')
  );
}

function reportSwitching(binpathFrom, binpathTo, loglevel, pkgFrom, pkgTo) {
  blankLineMaybe(loglevel);
  embarklog[loglevel]('invoked', binpathFrom);
  embarklog[loglevel]('located', binpathTo);
  embarklog[loglevel](
    '',
    `Switching from ${pkgFrom} to ${pkgTo}`
  );
}

function reportUnhandledCliException(error, loglevel) {
  if (!loglevel) loglevel = 'error';
  blankLineMaybe(loglevel);
  embarklog[loglevel]('', 'Unhandled exception in the command-line interface');
  embarklog[loglevel]('', error.stack);
}

function reportUnimportable(filepath, error, loglevel) {
  blankLineMaybe(loglevel);
  embarklog[loglevel]('file', filepath);
  if (error.code) embarklog[loglevel]('code', error.code);
  embarklog[loglevel]('require', `Failed to import module`);
  embarklog[loglevel]('', error.stack);
}

function reportUnparsable(filepath, loglevel) {
  try {
    // force the exception
    parseJsonWithErrors(stripBOM(fs.readFileSync(filepath)));
  } catch (e) {
    var basename = path.basename(filepath);
    blankLineMaybe(loglevel);
    embarklog[loglevel]('file', filepath);
    embarklog[loglevel]('code', `EJSONPARSE`);
    embarklog[loglevel]('JSON parse', `Failed to parse json`);
    embarklog[loglevel]('JSON parse', e.message);
    embarklog[loglevel]('JSON parse', `Failed to parse ${basename} data.`);
    embarklog[loglevel]('JSON parse', `${basename} must be actual JSON, not just JavaScript.`);
  }
}

function reportUnparsable_EmbarkJson(loglevel) {
  console[loglevel]();
  embarklog[loglevel]('', `Could not parse your DApp's embark.json file`);
}

function reportUnparsable_PkgJsonEmbark(kind, loglevel) {
  console[loglevel]();
  embarklog[loglevel](
    `Could not parse ${kind} embark's package.json file`
  );
}

function reportUnparsable_PkgJsonLocal(loglevel) {
  embarklog[loglevel]('', `Could not parse a local package.json file`);
}

function reportUnsupportedNode(
  bad, filepath, kind, loglevel, missing, rangeDefault, rangeSupplied, pkg,
  procVer, range) {
  blankLineMaybe(loglevel);
  function report(qual, invalid) {
    embarklog[loglevel]('file', filepath);
    embarklog[loglevel](
      'engine',
      `package.json of ${kind} ${pkg} does not specify ${qual ? qual : ''}%j`,
      {engines: {node: '[semver]'}}
    );
    if (invalid) {
      embarklog[loglevel](
        'engine',
        `Specified: %j`, {engines: {node: rangeSupplied}}
      );
    }
    embarklog[loglevel](
      'engine',
      `Defaulting to: %j`, {engines: {node: rangeDefault}}
    );
    console[loglevel]();
  }
  if (missing) { report(); }
  if (bad) { report('a valid ', true); }
  embarklog[loglevel]('notsup', `Unsupported runtime`);
  embarklog[loglevel](
    'notsup',
    `${kind} ${pkg} is not compatible with your version of node`
  );
  embarklog[loglevel]('notsup', `Required:`, range);
  embarklog[loglevel]('notsup', `Actual:`, procVer);
}

// -- selectors ----------------------------------------------------------------

function select(invoked, local) {
  var embark;
  if (local) {
    embark = local;
  } else {
    embark = invoked;
  }
  return embark;
}

function selectLocal(containing, installed, invoked) {
  var local;
  if (containing.binrealpath &&
      containing.binrealpath !== invoked.binrealpath &&
      (!installed.binrealpath ||
       subdir(
         installed.pkgJsonLocalExpected.dirname,
         containing.pkgDir
       ))) {
    local = containing;
  }
  if (installed.binrealpath &&
      installed.binrealpath !== invoked.binrealpath &&
      (!containing.binrealpath ||
       subdir(containing.pkgDir, installed.pkgDir))) {
    local = installed;
  }
  if (local) { local.log(); }
  return local;
}

// -- utils --------------------------------------------------------------------

function exitWithError(code) {
  blankLineTrailingMaybe('error');
  process.exit(code || 1);
}

function initCwd() {
  var initCwd = process.env.INIT_CWD || process.cwd();
  // allow for env override
  initCwd = process.env.DAPP_PATH || initCwd;
  return initCwd;
}

function isDappCmd(cmd) {
  return [
    undefined,
    '-V',
    '--version',
    '-h',
    '--help',
    'new',
    'init',
    'demo',
    'version',
    'help'
  ].indexOf(cmd) === -1;
}

function isObject(val) {
  // eslint-disable-next-line
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
}

function setupProto(Sub, Par) {
  Sub.prototype = Object.create(Par.prototype);
  Sub.prototype.constructor = Sub;
}

// See: https://github.com/npm/cli/blob/v6.11.3/lib/utils/parse-json.js#L16
function stripBOM (content) {
  content = content.toString();
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

// -----------------------------------------------------------------------------

main();

/**
 * This source code was adapted from:
 * https://github.com/mgol/check-dependencies/blob/1.1.0/lib/check-dependencies.js
 *
 * Copyright (c) 2013 Michał Gołębiowski.
 *
 * The MIT license for this code may be found on GitHub:
 * https://github.com/mgol/check-dependencies/blob/1.1.0/LICENSE
 */

/* eslint-disable */

'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const findup = require('find-up').sync;
const semver = require('semver');
const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;

const checkDependenciesHelper = (syncOrAsync, config, callback) => {
  // We treat the signature:
  //     checkDependencies(callback)
  // as:
  //     checkDependencies({}, callback)

  if (syncOrAsync === 'async') {
    // Catch all cases where `config` is not an object - even if it's not a function
    // so it's useless here, we need it to be assigned to `callback` to provide
    // to the error message.
    if (typeof callback !== 'function' && (typeof config !== 'object' || config == null)) {
      callback = config;
      config = null;
    }
    if (typeof callback !== 'function') {
      if (callback == null) {
        // In the async mode we return the promise anyway; assign callback
        // to noop to keep code consistency.
        callback = () => {/* noop */};
      } else {
        // If callback was simply not provided, we assume the user wanted
        // to handle the returned promise. If it was passed but not a function
        // we assume user error and throw.
        throw new TypeError(`The provided callback wasn't a function! Got: ${ callback }`);
      }
    }
  }

  const spawnShellSupported = semver.satisfies(process.version, '>=4.8.0');
  const win32 = process.platform === 'win32';
  const output = {log: [], error: []};

  let depsDirName, packageJson, pkgManagerPath;

  let installPrunePromise = Promise.resolve();
  let success = true;
  let installNeeded = false;
  let pruneNeeded = false;

  const options = Object.assign({
    packageManager: 'npm',
    onlySpecified: false,
    install: false,
    scopeList: ['dependencies', 'devDependencies'],
    optionalScopeList: ['optionalDependencies'],
    verbose: false,
    checkGitUrls: false,
    checkCustomPackageNames: false,
    log: console.log.bind(console),
    error: console.error.bind(console),
  }, config);

  const packageJsonName = options.packageManager === 'npm' ? 'package.json' : 'bower.json';
  const packageJsonRegex = options.packageManager === 'npm' ? /package\.json$/ : /bower\.json$/;
  depsDirName = options.packageManager === 'npm' ? 'node_modules' : 'bower_components';

  const log = message => {
    output.log.push(message);
    if (options.verbose) {
      options.log(message);
    }
  };

  const error = message => {
    output.error.push(message);
    if (options.verbose) {
      options.error(message);
    }
  };

  const finish = () => {
    output.status = success ? 0 : 1;
    if (syncOrAsync === 'async') {
      callback(output);
      return Promise.resolve(output);
    }
    return output;
  };

  const missingPackageJson = () => {
    success = false;
    error(`Missing ${ packageJsonName }!`);
    return finish();
  };

  options.packageDir = options.packageDir || findup(packageJsonName);
  if (!options.packageDir) {
    return missingPackageJson();
  }
  options.packageDir = path.resolve(options.packageDir.replace(packageJsonRegex, ''));

  packageJson = `${ options.packageDir }/${ packageJsonName }`;
  if (!fs.existsSync(packageJson)) {
    return missingPackageJson();
  }
  packageJson = require(packageJson);

  if (options.packageManager === 'bower') {
    const bowerConfig = require('bower-config').create(options.packageDir).load();
    depsDirName = bowerConfig._config.directory;
  }

  // Bower uses a different name (with a dot) for package data of dependencies.
  const depsJsonName = options.packageManager === 'npm' ? 'package.json' : '.bower.json';

  if (options.packageManager === 'bower') {
    // Allow a local bower.
    pkgManagerPath = findup('node_modules/bower/bin/bower');
  }

  const depsDir = `${ options.packageDir }/${ depsDirName }`;

  const getDepsMappingsFromScopeList = scopeList =>
        // Get names of all packages specified in package.json/bower.json at keys from scopeList
        // together with specified version numbers.
        scopeList.reduce((result, scope) => Object.assign(result, packageJson[scope]), {});

  // Make sure each package from `scopeList` is present and matches the specified version range.
  // Packages from `optionalScopeList` may not be present but if they are, they are required
  // to match the specified version range.
  const checkPackage = pkg => {
    const name = pkg.name;
    let versionString = pkg.versionString;

    const depDir = findup(`${ depsDirName }/${ name }`, {cwd: options.packageDir});
    const depJson = `${ depDir }/${ depsJsonName }`;

    if (!fs.existsSync(depDir) || !fs.existsSync(depJson)) {
      if (pkg.isOptional) {
        log(`${ name }: ${ chalk.red('not installed!') }`);
      } else {
        error(`${ name }: ${ chalk.red('not installed!') }`);
        success = false;
      }
      return;
    }

    // Let's look if we can get a valid version from a Git URL
    if (options.checkGitUrls && /\.git.*#v?(.+)$/.test(versionString)) {
      versionString = (/#v?(.+)$/.exec(versionString))[1];
      if (!semver.valid(versionString)) {
        return;
      }
    }

    // Quick and dirty check - make sure we're not dealing with a URL
    if (/\//.test(versionString)) {
      return;
    }

    // Bower has the option to specify a custom name, e.g. 'packageOld' : 'package#1.2.3'
    if (options.checkCustomPackageNames && options.packageManager !== 'npm') {
      // Let's look if we can get a valid version from a custom package name (with a # in it)
      if (/\.*#v?(.+)$/.test(versionString)) {
        versionString = (/#v?(.+)$/.exec(versionString))[1];
        if (!semver.valid(versionString)) {
          return;
        }
      }
    }

    // If we are dealing with a custom package name, semver check won't work - skip it
    if (/#/.test(versionString)) {
      return;
    }

    // Skip version checks for 'latest' - the semver module won't help here and the check
    // would have to consult the npm server, making the operation slow.
    if (versionString === 'latest') {
      return;
    }

    const depVersion = require(depJson).version;
    if (semver.satisfies(depVersion, versionString)) {
      log(`${ name }: installed: ${ chalk.green(depVersion)
            }, expected: ${ chalk.green(versionString) }`);
    } else {
      success = false;
      error(`${ name }: installed: ${ chalk.red(depVersion)
            }, expected: ${ chalk.green(versionString) }`);
    }
  };

  const depsMappings = getDepsMappingsFromScopeList(options.scopeList);
  const optionalDepsMappings = getDepsMappingsFromScopeList(options.optionalScopeList);
  const fullDepsMappings = Object.assign({}, depsMappings, optionalDepsMappings);

  Object.keys(depsMappings).forEach(name => {
    checkPackage({name, versionString: depsMappings[name], isOptional: false});
  });

  Object.keys(optionalDepsMappings).forEach(name => {
    checkPackage({name, versionString: optionalDepsMappings[name], isOptional: true});
  });

  installNeeded = !success;

  if (options.onlySpecified) {
    fs
      .readdirSync(depsDir)

    // Ignore hidden directories
      .filter(depName => depName[0] !== '.')

    // Ignore files
      .filter(depName => fs.lstatSync(`${ depsDir }/${ depName }`).isDirectory())

      .forEach(depName => {
        let depSubDirName;

        // Scoped packages
        if (depName[0] === '@') {
          depName = fs.readdirSync(`${ depsDir }/${ depName }`)[0];

          // Ignore weird directories - if it just looks like a scoped package but
          // isn't one, just skip it.
          if (depSubDirName && !fullDepsMappings[depName]) {
            success = false;
            pruneNeeded = true;
            error(`Package ${ depName } installed, though it shouldn't be`);
          }
          return;
        }

        // Regular packages
        if (!fullDepsMappings[depName]) {
          success = false;
          pruneNeeded = true;
          error(`Package ${ depName } installed, though it shouldn't be`);
        }
      });
  }

  if (success) {
    output.depsWereOk = true;
    return finish();
  }
  output.depsWereOk = false;

  if (!options.install) {
    if (options.onlySpecified) {
      error(`Invoke ${ chalk.green(`${ options.packageManager } prune`) } and ${
                chalk.green(`${ options.packageManager } install`)
            } to install missing packages and remove excessive ones`);
    } else {
      error(`Invoke ${ chalk.green(`${ options.packageManager } install`)
            } to install missing packages`);
    }
    return finish();
  }


  const installOrPrune = mode => {
    log(`Invoking ${ chalk.green(`${ options.packageManager } ${ mode }`) }...`);

    // If we're using a direct path, on Windows we need to invoke it via `node path`, not
    // `cmd /c path`. In UNIX systems we can execute the command directly so no need to wrap.
    let msg, spawnReturn;
    const method = syncOrAsync === 'sync' ? spawnSync : spawn;

    if (spawnShellSupported) {
      spawnReturn = method(`${ options.packageManager } ${ mode }`,
                           {
                             cwd: options.packageDir,
                             stdio: 'inherit',
                             shell: true,
                           });
    } else if (win32) {
      spawnReturn = method(pkgManagerPath ? 'node' : 'cmd',
                           (pkgManagerPath ? [pkgManagerPath] : ['/c', options.packageManager]).concat(mode),
                           {
                             cwd: options.packageDir,
                             stdio: 'inherit',
                           });
    } else {
      spawnReturn = method(options.packageManager,
                           [mode],
                           {
                             cwd: options.packageDir,
                             stdio: 'inherit',
                           });
    }

    if (syncOrAsync === 'sync') {
      if (spawnReturn.status !== 0) {
        msg = `${ options.packageManager } ${ mode } failed with code: ${
                    chalk.red(spawnReturn.status) }`;
        throw new Error(msg);
      }
      return null;
    }
    return new Promise((resolve, reject) => {
      spawnReturn.on('close', code => {
        if (code === 0) {
          resolve();
          return;
        }
        msg = `${ options.packageManager } ${ mode } failed with code: ${
                    chalk.red(code) }`;
        error(msg);
        reject(msg);
      });
    });
  };

  const installMissing = () => installOrPrune('install');
  const pruneExcessive = () => installOrPrune('prune');

  // In some circumstances, e.g. if npm discovers a package is broken, npm may decide to remove
  // a package when pruning even if versions in package.json match. It's safer to always install
  // before prunning then so that the end state is always correct.
  if (pruneNeeded) {
    installNeeded = true;
  }

  if (syncOrAsync === 'sync') {
    try {
      if (installNeeded) {
        installMissing();
      }

      if (pruneNeeded) {
        pruneExcessive();
      }

      success = true;
    } catch (error) {
      success = false;
    }
    return finish();
  }

  // Async scenario
  if (installNeeded) {
    installPrunePromise = installPrunePromise.then(installMissing);
  }

  if (pruneNeeded) {
    installPrunePromise = installPrunePromise.then(pruneExcessive);
  }

  return installPrunePromise
    .then(() => {
      success = true;
      return finish();
    })
    .catch(() => {
      success = false;
      return finish();
    });
};

module.exports = (cfg, cb) => checkDependenciesHelper('async', cfg, cb);
module.exports.sync = (cfg, cb) => checkDependenciesHelper('sync', cfg, cb);

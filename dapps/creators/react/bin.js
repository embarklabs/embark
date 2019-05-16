#!/usr/bin/env node
/* this script is written to be runnable with node >=0.10.0 */
/* global __dirname process require */

var cliUtils = require('embark-cli-utils');
var path = require('path');
var pkgJsonPath = path.join(__dirname, 'package.json');

cliUtils.enforceRuntimeNodeVersion(pkgJsonPath);

function exitWithError(err) {
  cliUtils.exitWithError(pkgJsonPath, null, err);
}

// refactor this
// null,
// path.join(__dirname, 'dist/cli-program'),
// 'Create Embark React Dapp'

try {
  require('source-map-support/register');
  require('./dist').create()
    .then(function() { cliUtils.logSuccess("create done!"); })
    .catch(function (err) { exitWithError(err); });
} catch (err) {
  exitWithError(err);
}

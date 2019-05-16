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

var initOptions = {};

try {
  require('source-map-support/register');
  require('./dist')
    .init(initOptions)
    .then(function() { cliUtils.logSuccess("init done!"); })
    .catch(function (err) { exitWithError(err); });
} catch (err) {
  exitWithError(err);
}

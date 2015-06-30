(function() {
  var commander, compression, embark, express, hashmerge, jasmine, methodmissing, python, readYaml, shelljs, shelljs_global, syncMe, web3, wrench;

  hashmerge = require('hashmerge');

  readYaml = require('read-yaml');

  shelljs = require('shelljs');

  shelljs_global = require('shelljs/global');

  web3 = require('web3');

  express = require('express');

  compression = require('compression');

  commander = require('commander');

  wrench = require('wrench');

  python = require('python');

  syncMe = require('sync-me');

  methodmissing = require('methodmissing');

  jasmine = require('jasmine');

  embark = {};

  embark.Tests = require('./test.js');

  module.exports = embark;

}).call(this);

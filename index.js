var hashmerge = require('hashmerge');
var readYaml = require('read-yaml');
var shelljs = require('shelljs');
var shelljs_global = require('shelljs/global');
var web3 = require('web3');
var express = require('express');
var compression = require('compression');
var commander = require('commander');
var wrench = require('wrench');

var grunt = require('grunt');
var grunt_cli = require('grunt-cli');
var grunt_clean = require('grunt-contrib-clean');
var grunt_coffee = require('grunt-contrib-coffee');
var grunt_concat = require('grunt-contrib-concat');
var grunt_copy = require('grunt-contrib-copy');
var grunt_uglify = require('grunt-contrib-uglify');
var grunt_watch = require('grunt-contrib-watch');
var matchdep = require('matchdep');

console.log("loaded embark-framework");


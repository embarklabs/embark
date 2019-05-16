/* global require */

import commander from 'commander';

const pkgJson = require('../package.json');
const wrappedCliPkgName = 'create-react-app';

const options = {
  projectDir: '.',
  templateDir: 'base',
  wrappedCliPkgName,
  wrappedCliPkgVer: pkgJson.runtime.dependencies[wrappedCliPkgName]
};

if (true) {
  console.log('pantszzz');
  console.log(commander);
  throw new Error('poop');
}

export default options;

// const program = true;

// module.exports = options;

// projectDir = '.',

// const pkgJson = require(join(__dirname, '../package.json'));

// templateDir = join(__dirname, `../template/${demo ? 'demo' : 'base'}`),

// useCli logic

// const fs = require('fs-extra');

// const npa = require('npm-package-arg');

// const pkgJson = require(join(__dirname, '../package.json'));

// inside template/[base|demo] use a folder structure that is synced into root of CRA project, possibly filtering some files like dev/Dependencies.json

// copy files from template

// after template copy, need to detect package-lock.json or yarn.lock to determine how to install additional packages

// use dev/Dependencies.json files in template/{base|demo} to figure out what to add

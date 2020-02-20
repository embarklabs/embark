/* global after before describe it */

import { fs } from 'embark-code-runner';
const { embarkPath } = require('embark-utils');
const {assert} = require('chai');
const os = require('os');
const path = require('path');
const underlyingFs = require('fs-extra');

describe('embark.vm fs', () => {
  let fsMethods = {};
  let oldConsoleError;
  let oldDappPath;
  let oldProcessExit;

  before(() => {
    oldConsoleError = console.error;
    oldDappPath = process.env.DAPP_PATH;
    process.env.DAPP_PATH = embarkPath();
    oldProcessExit = process.exit;
    process.exit = function() {};

    for(const method in underlyingFs) {
      fsMethods[method] = underlyingFs[method];
      underlyingFs[method] = function() {};
    }
  });

  after(() => {
    process.env.DAPP_PATH = oldDappPath;
    process.exit = oldProcessExit;

    for(const method in underlyingFs) {
      underlyingFs[method] = fsMethods[method];
    }
  });

  const helperFunctions = [
    'dappPath',
    'default', // not a helper function but a property on `fs` due to how it's exported
    'diagramPath',
    'embarkPath',
    'ipcPath',
    'pkgPath',
    'tmpDir'
  ];

  const paths = [
    '/etc',
    '/home/testuser/src',
    '/usr'
  ];

  for(let func in fs) {
    if(helperFunctions.includes(func)) continue;

    describe(`fs.${func}`, () => {
      it('should throw exceptions on paths outside the DApp root', (done) => {
        paths.forEach(path => {
          assert.throws(() => {
            fs[func](path);
          }, /EPERM: Operation not permitted/);
        });

        done();
      });

      it('should not throw exceptions on paths inside the temporary dir root', (done) => {
        assert.doesNotThrow(async () => {
          try {
            if (func === 'readJSONSync') console.error = function() {};
            await fs[func](path.join(os.tmpdir(), 'foo'));
          } catch(e) {
            if(e.message.indexOf('EPERM') === 0) throw e;
          } finally {
            if (func === 'readJSONSync') console.error = oldConsoleError;
          }
        }, /EPERM: Operation not permitted/);

        done();
      });
    });
  }
});

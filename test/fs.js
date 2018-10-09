/*globals after, before, describe, it*/
const {assert} = require('chai');
const os = require('os');

const fs = require('../lib/core/fs');

describe('fs', () => {
  before(() => {
    this.oldDappPath = process.env.DAPP_PATH;
    process.env.DAPP_PATH = '/home/testuser/src/dapp_path/';

    this.oldProcessExit = process.exit;
    process.exit = function() {};
  });


  after(() => {
    process.env.DAPP_PATH = this.oldDappPath;
    process.exit = this.oldProcessExit;
  });

  const helperFunctions = [
    'dappPath',
    'embarkPath',
    'tmpDir'
  ];

  const paths = [
    '/etc',
    '/home/testuser/src',
    '/usr',
    '../'
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

      if(func === 'stat') return;

      it('should not throw exceptions on paths inside the temporary dir root', (done) => {
        assert.doesNotThrow(async () => {
          try {
            await fs[func](os.tmpdir() + '/foo');
          } catch(e) {
            if(e.message.indexOf('EPERM') === 0) throw e;
          }
        }, /EPERM: Operation not permitted/);

        done();
      });
    });
  }
});

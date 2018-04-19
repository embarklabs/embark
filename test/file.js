/*globals describe, it*/
const File = require('../lib/core/file');
const fs = require('fs-extra');

describe('embark.File', function () {
  describe('parseFileForImport', () => {
    it('should find all the imports', function (done) {
      const contract = fs.readFileSync('./test/contracts/simple_storage.sol').toString();
      const file = new File({filename: '.embark/contracts/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol',
        path: 'https://raw.githubusercontent.com/embark-framework/embark/develop/test_apps/test_app/app/contracts/simple_storage.sol'});
      file.parseFileForImport(contract, () => {
        done();
      });
    });
  });
});

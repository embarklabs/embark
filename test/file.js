/*globals describe, it*/
const File = require('../lib/core/file');
const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');
const sinon = require('sinon');

describe('embark.File', function () {
  describe('parseFileForImport', () => {
    it('should find all the imports', function (done) {
      const contract = fs.readFileSync('./test/contracts/contract_with_import.sol').toString();
      const file = new File({filename: '.embark/contracts/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol',
        path: 'https://raw.githubusercontent.com/embark-framework/embark/develop/test_apps/test_app/app/contracts/simple_storage.sol'});
      const downloadFileStub = sinon.stub(file, 'downloadFile')
        .callsFake((path, url, cb) => {
          cb();
        });

      file.parseFileForImport(contract, () => {
        assert.strictEqual(downloadFileStub.callCount, 1);
        assert.strictEqual(downloadFileStub.firstCall.args[0],
          path.normalize('.embark/contracts/embark-framework/embark/master/test_app/app/contracts/ownable.sol'));
        assert.strictEqual(downloadFileStub.firstCall.args[1],
          'https://raw.githubusercontent.com/embark-framework/embark/develop/test_apps/test_app/app/contracts/./ownable.sol');
        done();
      });
    });
  });
});

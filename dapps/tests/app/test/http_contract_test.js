/*globals describe, it*/
const fs = require('fs-extra');
const assert = require('assert');

describe('http contracts', () => {
  it('should have downloaded the file in .embark/contracts', (done) => {
    const contractPath = '.embark/contracts/status-im/contracts/151-embark31/contracts/token/StandardToken.sol';
    fs.access(contractPath, (err) => {
      if (err) {
        assert.fail(contractPath + ' was not downloaded');
      }
      done();
    });
  });

  it('should have downloaded the file import file too', (done) => {
    const contractImportPath = '.embark/contracts/status-im/contracts/151-embark31/contracts/token/ERC20Token.sol';
    fs.access(contractImportPath, (err) => {
      if (err) {
        assert.fail(contractImportPath + ' was not downloaded');
      }
      done();
    });
  });

  it('should have downloaded the http import in SimpleStorageWithHttpImport', (done) => {
    const contractImportPath = '.embark/contracts/embarklabs/embark/master/dapps/tests/contracts/contracts/ownable.sol';
    fs.access(contractImportPath, (err) => {
      if (err) {
        assert.fail(contractImportPath + ' was not downloaded');
      }
      done();
    });
  });
});

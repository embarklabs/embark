/*globals describe, it*/
const fs = require('fs-extra');
const assert = require('assert');

describe('http contracts', () => {
  const contractPath = '.embark/contracts/status-im/contracts/master/contracts/identity/Identity.sol';
  const contractImportPath = '.embark/contracts/status-im/contracts/master/contracts/identity/ERC725.sol';

  it('should have downloaded the file in .embark/contracts', (done) => {
    fs.access(contractPath, (err) => {
      if (err) {
        assert.fail(contractPath + ' was not downloaded');
      }
      done();
    });
  });

  it('should have downloaded the file import file too', (done) => {
    fs.access(contractImportPath, (err) => {
      if (err) {
        assert.fail(contractPath + ' was not downloaded');
      }
      done();
    });
  });
});

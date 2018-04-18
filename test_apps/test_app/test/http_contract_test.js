/*globals describe, it*/
const fs = require('fs-extra');
const assert = require('assert');

describe('http contracts', () => {
  describe('ERC725', () => {
    const contractPath = '.embark/contracts/ERC725.sol';

    it('should have downloaded the file in .embark/contracts', (done) => {
      fs.access(contractPath, (err) => {
        if (err) {
          assert.fail(contractPath + ' was not downloaded');
        }
        done();
      });
    });
  });
});

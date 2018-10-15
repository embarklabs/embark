/*global describe, it*/
const Utils = require('../lib/utils/utils');
const assert = require('assert');
const constants = require('../lib/constants');

describe('embark.utils', function () {
  describe('#getExternalContractUrl', function () {
    it('should get the right url for a https://github file', function () {
      const fileObj = Utils.getExternalContractUrl(
        'https://github.com/embark-framework/embark/blob/master/test_app/app/contracts/simple_storage.sol'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'embark-framework/embark/master/test_app/app/contracts/simple_storage.sol',
          url: 'https://raw.githubusercontent.com/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol'
        });
    });

    it('should fail for a malformed https://github file', function () {
      const fileObj = Utils.getExternalContractUrl(
        'https://github/embark-framework/embark/blob/master/test_app/app/contracts/simple_storage.sol'
      );
      assert.strictEqual(fileObj, null);
    });

    it('should get the right url for a git:// file with no branch #', function () {
      const fileObj = Utils.getExternalContractUrl(
        'git://github.com/status-im/contracts/contracts/identity/ERC725.sol'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'status-im/contracts/master/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol'
        });
    });

    it('should get the right url for a git:// file with a branch #', function () {
      const fileObj = Utils.getExternalContractUrl(
        'git://github.com/status-im/contracts/contracts/identity/ERC725.sol#myBranch'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'status-im/contracts/myBranch/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/myBranch/contracts/identity/ERC725.sol'
        });
    });

    it('should fail when the git:// file is malformed', function () {
      const fileObj = Utils.getExternalContractUrl(
        'git://github.com/identity/ERC725.sol#myBranch'
      );
      assert.strictEqual(fileObj, null);
    });

    it('should get the right url with a github.com file without branch #', function () {
      const fileObj = Utils.getExternalContractUrl(
        'github.com/status-im/contracts/contracts/identity/ERC725.sol'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'status-im/contracts/master/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol'
        });
    });

    it('should get the right url with a github.com file with branch #', function () {
      const fileObj = Utils.getExternalContractUrl(
        'github.com/status-im/contracts/contracts/identity/ERC725.sol#theBranch'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'status-im/contracts/theBranch/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/theBranch/contracts/identity/ERC725.sol'
        });
    });

    it('should fail with a malformed github.com url', function () {
      const fileObj = Utils.getExternalContractUrl(
        'github/status-im/contracts/contracts/identity/ERC725.sol#theBranch'
      );
      assert.strictEqual(fileObj, null);
    });

    it('should succeed with a generic http url', function () {
      const fileObj = Utils.getExternalContractUrl(
        'http://myurl.com/myFile.sol'
      );
      assert.deepEqual(fileObj, {
        filePath: constants.httpContractsDirectory + 'myFile.sol',
        url: 'http://myurl.com/myFile.sol'
      });
    });
  });
});

/*global describe, it*/
import { getExternalContractUrl } from 'embark-utils';
const assert = require('assert');
const constants = require('embark-core/constants');

describe('embark.utils', function () {
  describe('#getExternalContractUrl', function () {
    it('should get the right url for a https://github file', function () {
      const fileObj = getExternalContractUrl(
        'https://github.com/embarklabs/embark/blob/master/dapps/templates/demo/contracts/simple_storage.sol'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'embarklabs/embark/master/dapps/templates/demo/contracts/simple_storage.sol',
          url: 'https://raw.githubusercontent.com/embarklabs/embark/master/dapps/templates/demo/contracts/simple_storage.sol'
        });
    });

    it('should fail for a malformed https://github file', function () {
      const fileObj = getExternalContractUrl(
        'https://github/embarklabs/embark/blob/master/dapps/templates/demo/contracts/simple_storage.sol'
      );
      assert.strictEqual(fileObj, null);
    });

    it('should get the right url for a git:// file with no branch #', function () {
      const fileObj = getExternalContractUrl(
        'git://github.com/status-im/contracts/contracts/identity/ERC725.sol'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'status-im/contracts/master/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol'
        });
    });

    it('should get the right url for a git:// file with a branch #', function () {
      const fileObj = getExternalContractUrl(
        'git://github.com/status-im/contracts/contracts/identity/ERC725.sol#myBranch'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'status-im/contracts/myBranch/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/myBranch/contracts/identity/ERC725.sol'
        });
    });

    it('should fail when the git:// file is malformed', function () {
      const fileObj = getExternalContractUrl(
        'git://github.com/identity/ERC725.sol#myBranch'
      );
      assert.strictEqual(fileObj, null);
    });

    it('should get the right url with a github.com file without branch #', function () {
      const fileObj = getExternalContractUrl(
        'github.com/status-im/contracts/contracts/identity/ERC725.sol'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'status-im/contracts/master/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol'
        });
    });

    it('should get the right url with a github.com file with branch #', function () {
      const fileObj = getExternalContractUrl(
        'github.com/status-im/contracts/contracts/identity/ERC725.sol#theBranch'
      );
      assert.deepEqual(fileObj,
        {
          filePath: constants.httpContractsDirectory + 'status-im/contracts/theBranch/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/theBranch/contracts/identity/ERC725.sol'
        });
    });

    it('should fail with a malformed github.com url', function () {
      const fileObj = getExternalContractUrl(
        'github/status-im/contracts/contracts/identity/ERC725.sol#theBranch'
      );
      assert.strictEqual(fileObj, null);
    });

    it('should succeed with a generic http url', function () {
      const fileObj = getExternalContractUrl(
        'http://myurl.com/myFile.sol'
      );
      assert.deepEqual(fileObj, {
        filePath: constants.httpContractsDirectory + 'myFile.sol',
        url: 'http://myurl.com/myFile.sol'
      });
    });

    it('should get the correct default url for a correct bzz:/ swarm file', function () {
      const swarmFile = 'bzz:/someensdomain.eth/ERC725.sol';
      const fileObj = getExternalContractUrl(
        swarmFile
      );
      assert.deepEqual(fileObj, {
        filePath: constants.httpContractsDirectory + swarmFile,
        url: 'https://swarm-gateways.net/' + swarmFile
      });
    });

    it('should get the correct url for a correct bzz:/ swarm file when a http swarm gateway is explicitly provided', function () {
      const swarmFile = 'bzz:/someensdomain.eth/ERC725.sol';
      const fileObj = getExternalContractUrl(
        swarmFile,
        'http://localhost:8500'
      );
      assert.deepEqual(fileObj, {
        filePath: constants.httpContractsDirectory + 'ERC725.sol',
        url: 'http://localhost:8500/' + swarmFile
      });
    });

    it('should get the correct url for a correct bzz:/ swarm file when a https swarm gateway is provided', function () {
      const swarmFile = 'bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63';
      const fileObj = getExternalContractUrl(
        swarmFile,
        'https://swarm-gateways.net'
      );
      assert.deepEqual(fileObj, {
        filePath: constants.httpContractsDirectory + swarmFile,
        url: 'https://swarm-gateways.net/' + swarmFile
      });
    });
  });
});

/*globals describe, it*/
const { dappPath, File, Types } = require('embark-utils');
const {expect} = require("chai");
const fs = require("../lib/core/fs");

describe('embark.File', function () {
  describe('Read file contents', function () {
    it('should be able to download a file when type is "http"', async () => {
      const file = new File({externalUrl: 'https://raw.githubusercontent.com/embark-framework/embark/master/dapps/tests/app/app/contracts/simple_storage.sol', type: Types.http});
      const content = await file.content;

      expect(content).to.be.ok; //eslint-disable-line
    });

    it('should be able to read a file when type is "dappFile"', async () => {
      const file = new File({path: dappPath('contracts/recursive_test_0.sol'), type: Types.dappFile});
      const content = await file.content;

      const contentFromFileSystem = fs.readFileSync(dappPath("contracts/recursive_test_0.sol")).toString();
      expect(content).to.equal(contentFromFileSystem);
    });

    it('should be able to execute a resolver when type is "custom"', async () => {
      const file = new File({path: dappPath('contracts/recursive_test_0.sol'), type: Types.custom, resolver: (callback) => {
        callback("test");
      }});
      expect(await file.content).to.equal("test");
    });

    it('should be able to read a file when type is "embarkInternal"', async () => {
      const file = new File({path: 'test/contracts/recursive_test_0.sol', type: Types.embarkInternal});
      const content = await file.content;

      const contentFromFileSystem = fs.readFileSync(dappPath("contracts/recursive_test_0.sol")).toString();
      expect(content).to.equal(contentFromFileSystem);
    });

  });
});

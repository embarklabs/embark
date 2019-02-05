/*globals describe, it*/
const {File, Types} = require("../lib/core/file");
const path = require("path");
const {expect} = require("chai");
const fs = require("../lib/core/fs");
const fsNode = require("fs");

describe('embark.File', function () {
  describe('Read file contents', function () {
    it('should be able to download a file when type is "http"', async () => {
      const file = new File({externalUrl: 'https://raw.githubusercontent.com/embark-framework/embark/master/test_dapps/test_app/app/contracts/simple_storage.sol', type: Types.http});
      const content = await file.content;

      const contentFromFileSystem = fsNode.readFileSync(path.join(fs.embarkPath(), "../../", "test_dapps/test_app/app/contracts/simple_storage.sol")).toString();
      expect(content).to.equal(contentFromFileSystem);
    });

    it('should be able to read a file when type is "dappFile"', async () => {
      const file = new File({path: fs.dappPath('contracts/recursive_test_0.sol'), type: Types.dappFile});
      const content = await file.content;

      const contentFromFileSystem = fs.readFileSync(fs.dappPath("contracts/recursive_test_0.sol")).toString();
      expect(content).to.equal(contentFromFileSystem);
    });

    it('should be able to execute a resolver when type is "custom"', async () => {
      const file = new File({path: fs.dappPath('contracts/recursive_test_0.sol'), type: Types.custom, resolver: (callback) => {
        callback("test");
      }});
      expect(await file.content).to.equal("test");
    });

    it('should be able to read a file when type is "embarkInternal"', async () => {
      const file = new File({path: 'test/contracts/recursive_test_0.sol', type: Types.embarkInternal});
      const content = await file.content;

      const contentFromFileSystem = fs.readFileSync(fs.dappPath("contracts/recursive_test_0.sol")).toString();
      expect(content).to.equal(contentFromFileSystem);
    });

  });
});

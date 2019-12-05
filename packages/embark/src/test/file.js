/*globals describe, it, before*/
const { dappPath, File, joinPath, setUpEnv, Types } = require('embark-utils');
const { expect } = require("chai");
const fs = require("fs-extra");
const { HttpMockServer } = require("embark-testing");

setUpEnv(joinPath(__dirname, '../../'));

let connectionString;

describe('embark.File', function () {
  describe('Read file contents', function () {
    before('set up mock HTTP server', async () => {
      const server = new HttpMockServer.default();
      connectionString = await server.init();
      server.addRoute({
        path: "/simple_storage.sol",
        result: "great success!"
      });
    });
    it('should be able to download a file when type is "http"', async () => {
      const file = new File({ externalUrl: `${connectionString}/simple_storage.sol`, type: Types.http });
      const content = await file.content;

      expect(content).to.equal("great success!"); //eslint-disable-line
    });

    it('should be able to read a file when type is "dappFile"', async () => {
      const file = new File({ path: dappPath('contracts/recursive_test_0.sol'), type: Types.dappFile });
      const content = await file.content;

      const contentFromFileSystem = fs.readFileSync(dappPath("contracts/recursive_test_0.sol")).toString();
      expect(content).to.equal(contentFromFileSystem);
    });

    it('should be able to execute a resolver when type is "custom"', async () => {
      const file = new File({
        path: dappPath('contracts/recursive_test_0.sol'), type: Types.custom, resolver: (callback) => {
          callback("test");
        }
      });
      expect(await file.content).to.equal("test");
    });

    it('should be able to read a file when type is "embarkInternal"', async () => {
      const file = new File({ path: 'test/contracts/recursive_test_0.sol', type: Types.embarkInternal });
      const content = await file.content;

      const contentFromFileSystem = fs.readFileSync(dappPath("contracts/recursive_test_0.sol")).toString();
      expect(content).to.equal(contentFromFileSystem);
    });

  });
});

/*globals describe, it, before*/
const {File, Types} = require("../../../lib/core/file");
const path = require("path");
const remapImports = require("../../../lib/utils/solidity/remapImports");
const {expect} = require("chai");
const fs = require("../../../lib/core/fs");
const fsNode = require("fs");

let file, content;

describe('embark.RemapImports', function () {
  describe('Import remappings from local file', function () {
    before('do the remappings', async () => {
      file = new File({path: 'contracts/recursive_test_0.sol', type: Types.dappFile});
      content = await remapImports.prepareForCompilation(file);
    });

    it("should find and add remappings for all recursive imports", (done) => {
      expect(file.importRemappings[0]).to.deep.equal({
        prefix: "./recursive_test_1.sol",
        target: fs.dappPath(".embark/contracts/recursive_test_1.sol")
      });
      expect(file.importRemappings[1]).to.deep.equal({
        prefix: "./recursive_test_2.sol",
        target: fs.dappPath(".embark/contracts/recursive_test_2.sol")
      });
      expect(file.importRemappings[2]).to.deep.equal({
        prefix: "embark-test-contract-0/recursive_test_3.sol",
        target: fs.dappPath(".embark/node_modules/embark-test-contract-0/recursive_test_3.sol")
      });
      expect(file.importRemappings[3]).to.deep.equal({
        prefix: "embark-test-contract-1/recursive_test_4.sol",
        target: fs.dappPath(".embark/node_modules/embark-test-contract-1/recursive_test_4.sol")
      });
      done();
    });

    it("should update the contract content to use the remapped imports", function (done) {
      expect(content).to.not.contain("./recursive_test_1.sol");
      expect(content).to.contain(".embark/contracts/recursive_test_1.sol");

      let contractFromFilesystem = fsNode.readFileSync(fs.dappPath(".embark/contracts/recursive_test_0.sol")).toString();
      expect(contractFromFilesystem).to.not.contain("./recursive_test_1.sol");
      expect(contractFromFilesystem).to.contain(".embark/contracts/recursive_test_1.sol");
      
      contractFromFilesystem = fsNode.readFileSync(fs.dappPath(".embark/contracts/recursive_test_1.sol")).toString();
      expect(contractFromFilesystem).to.not.contain("./recursive_test_2.sol");
      expect(contractFromFilesystem).to.contain(".embark/contracts/recursive_test_2.sol");

      contractFromFilesystem = fsNode.readFileSync(fs.dappPath(".embark/contracts/recursive_test_2.sol")).toString();
      expect(contractFromFilesystem).to.not.contain("import \"embark-test-contract-0/recursive_test_3.sol\"");
      expect(contractFromFilesystem).to.contain(`import "${fs.dappPath(".embark/node_modules/embark-test-contract-0/recursive_test_3.sol")}"`);
      
      contractFromFilesystem = fsNode.readFileSync(fs.dappPath(".embark/node_modules/embark-test-contract-0/recursive_test_3.sol")).toString();
      expect(contractFromFilesystem).to.not.contain("import \"embark-test-contract-1/recursive_test_4.sol\"");
      expect(contractFromFilesystem).to.contain(`import "${fs.dappPath(".embark/node_modules/embark-test-contract-1/recursive_test_4.sol")}"`);
      
      done();
    });

  });

  describe('Import remappings from external URL', function () {
    before('do the external HTTP contract remappings', async () => {
      file = new File({externalUrl: 'https://github.com/embark-framework/embark/blob/master/src/test/contracts/recursive_test_0.sol', type: Types.http});
      content = await remapImports.prepareForCompilation(file);
    });

    it("should find and add remappings for all recursive imports", (done) => {
      expect(file.importRemappings[0]).to.deep.equal({
        prefix: "./recursive_test_1.sol",
        target: fs.dappPath(".embark/contracts/embark-framework/embark/master/src/test/contracts/recursive_test_1.sol")
      });
      expect(file.importRemappings[1]).to.deep.equal({
        prefix: "./recursive_test_2.sol",
        target: fs.dappPath(".embark/contracts/embark-framework/embark/master/src/test/contracts/recursive_test_2.sol")
      });
      expect(file.importRemappings[2]).to.deep.equal({
        prefix: "embark-test-contract-0/recursive_test_3.sol",
        target: fs.dappPath(".embark/contracts/embark-framework/embark/master/src/test/contracts/embark-test-contract-0/recursive_test_3.sol")
      });
      done();
    });

    it("should update the contract content to use the remapped imports", function (done) {
      expect(content).to.not.contain("./recursive_test_1.sol");
      expect(content).to.contain(".embark/contracts/embark-framework/embark/master/src/test/contracts/recursive_test_1.sol");

      let contractFromFilesystem = fsNode.readFileSync(fs.dappPath(".embark/contracts/embark-framework/embark/master/src/test/contracts/recursive_test_0.sol")).toString();
      expect(contractFromFilesystem).to.not.contain("./recursive_test_1.sol");
      expect(contractFromFilesystem).to.contain(".embark/contracts/embark-framework/embark/master/src/test/contracts/recursive_test_1.sol");
      
      contractFromFilesystem = fsNode.readFileSync(fs.dappPath(".embark/contracts/embark-framework/embark/master/src/test/contracts/recursive_test_1.sol")).toString();
      expect(contractFromFilesystem).to.not.contain("./recursive_test_2.sol");
      expect(contractFromFilesystem).to.contain(".embark/contracts/embark-framework/embark/master/src/test/contracts/recursive_test_2.sol");

      contractFromFilesystem = fsNode.readFileSync(fs.dappPath(".embark/contracts/embark-framework/embark/master/src/test/contracts/recursive_test_2.sol")).toString();
      expect(contractFromFilesystem).to.not.contain("import \"embark-test-contract-0/recursive_test_3.sol\"");
      expect(contractFromFilesystem).to.contain(`import "${fs.dappPath(".embark/contracts/embark-framework/embark/master/src/test/contracts/embark-test-contract-0/recursive_test_3.sol")}"`);

      done();
    });
  });

});

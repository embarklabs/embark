/*globals describe, it*/
import DeploymentChecks from "../deploymentChecks";
import TrackingFunctions from "../trackingFunctions";
const fs = require('fs-extra');
const sinon = require('sinon');
const expect = require('expect.js');
import {beforeEach, afterEach} from "mocha";
import { Logger } from "embark-logger";
require("colors");

describe('embark.deploymentChecks', function () {
  let logger = new Logger({logLevel: 'error'});
  let events = {once: () => {}, setCommandHandler: () => {}, emit: () => {}, on: () => {}, request: () => {}, request2: () => {}};

  let params;
  let trackingFunctions;
  let deploymentChecks;
  let contractInChainsFake;
  let chainsFake;
  let trackedContract;
  let exists;
  let readJSON;
  let writeJSON;
  let _web3;
  let contractsConfig;

  beforeEach(() => {
    params = {
      shouldDeploy: true,
      contract: {
        className: "TestContract",
        log: () => {}
      }
    };
    trackedContract = {
      "name": "TestContract",
      "address": "0xbe474fb88709f99Ee83901eE09927005388Ab2F1"
    };
    contractInChainsFake = {
      "contracts": {
        "0x35e400a0b1817a3cfaf09eed53a76eaa169771f28c3630e23e6db2851d99a849": trackedContract
      }
    };
    chainsFake = {
      "0x7aec9250dcc5f6bedc3d0d582e0be8b8d159a4d483c47309e122ba5702ec6a16": contractInChainsFake,
      "some other hash": {
        "contracts": {
          "contract hash": {
            "name": "doesn't exist",
            "address": "0x123"
          }
        }
      }
    };
    exists = sinon.stub(fs, 'exists').returns(true);
    readJSON = sinon.stub(fs, 'readJSON').returns(chainsFake);
    writeJSON = sinon.stub(fs, 'writeJSON');
    trackingFunctions = new TrackingFunctions({
      config: {
        contractsConfig: {
          tracking: undefined
        }
      },
      env: "development",
      fs,
      events,
      logger,
      trackContracts: true
    });
    _web3 = {
      eth: {
        getBlock: () => {
          return {
            hash: "0x7aec9250dcc5f6bedc3d0d582e0be8b8d159a4d483c47309e122ba5702ec6a16"
          };
        },
        getCode: () => "BYTECODE"
      }
    };
    trackingFunctions._web3 = _web3;
    contractsConfig = {};
    deploymentChecks = new DeploymentChecks({ trackingFunctions, events, logger, contractsConfig });
    deploymentChecks._web3 = _web3;
  });
  afterEach(() => {
    exists.restore();
    readJSON.restore();
    writeJSON.restore();
  });

  process.env.DAPP_PATH = process.cwd();


  describe('#checkContractConfig', function () {
    it("should deploy", async function () {
      return deploymentChecks.checkContractConfig(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(true);
      });
    });

    it("should not deploy if previous action has already determined it shouldn't deploy", function () {
      params.shouldDeploy = false;
      return deploymentChecks.checkContractConfig(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(false);
      });
    });
    it("should not deploy if contract config set to not deploy", async function () {
      params.contract.deploy = false;
      return deploymentChecks.checkContractConfig(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(false);
      });
    });
    it("should error with invalid address", function () {
      params.contract.address = "0x123";
      return deploymentChecks.checkContractConfig(params, (err, _params) => {
        expect(err).to.not.be(null);
      });
    });
    it("should set the deployed address accordingly", function () {
      params.contract.address = "0x901d8340A14af4a46E22FE4CCF2A012d379F1a97";
      return deploymentChecks.checkContractConfig(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.contract.deployedAddress).to.be("0x901d8340A14af4a46E22FE4CCF2A012d379F1a97");
        expect(params.shouldDeploy).to.be(false);
      });
    });
  });

  let getContract;

  describe('#checkIfAlreadyDeployed', () => {
    beforeEach(() => {
      getContract = sinon.stub(trackingFunctions, "getContract").returns(trackedContract);
    });
    afterEach(() => {
      getContract.restore();
    });
    it("should not deploy if previous action has already determined it shouldn't deploy", async function () {
      params.shouldDeploy = false;
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(false);
      });
    });
    it("should deploy if contract not already tracked", async function () {
      getContract.restore();
      getContract = sinon.stub(trackingFunctions, "getContract").returns(null);
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(true);
      });
    });
    it("should deploy if contract tracked but set to track false", function () {
      params.contract.track = false;
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(true);
      });
    });
    it("should deploy if contract tracking disabled (ie tests)", async function () {
      trackedContract.track = false;
      trackingFunctions.trackContracts = false;
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(true);
      });
    });
    it("should not deploy if contract is tracked, but bytecode exists on chain", async function () {
      trackingFunctions._web3.eth.getCode = () => "0x0123";
      params.contract.runtimeBytecode = '0123';
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(false);
        expect(params.contract.deployedAddress).to.be("0xbe474fb88709f99Ee83901eE09927005388Ab2F1");
      });
    });
    it("should not deploy if contract is tracked and bytecode check is skipped", async function () {
      deploymentChecks.contractsConfig = {
        contracts: {
          TestContract: {
            skipBytecodeCheck: true
          }
        }
      };
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(false);
        expect(params.contract.deployedAddress).to.be("0xbe474fb88709f99Ee83901eE09927005388Ab2F1");
      });
    });
    it("should deploy if contract is tracked, but bytecode doesn't exist on chain", async function () {
      trackingFunctions._web3.eth.getCode = () => "0x0";
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(true);
      });
    });
    it("should update tracked contract in chains.json when contract.track !== false", async function () {
      const trackAndSaveContract = sinon.stub(trackingFunctions, "trackAndSaveContract");
      const {contract} = params;
      trackingFunctions._web3.eth.getCode = () => "0x0123";
      params.contract.runtimeBytecode = '0123';
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, params) => {
        expect(err).to.be(null);
        expect(params.shouldDeploy).to.be(false);
        expect(trackAndSaveContract.calledWith(contract)).to.be(true);
      });
    });
    it("should error (and not deploy) if tracked contract address is invalid", async function () {
      trackingFunctions._web3.eth.getCode = () => { throw new Error(); };
      return deploymentChecks.checkIfAlreadyDeployed(params, (err, _params) => {
        expect(err).to.not.be(null);
      });
    });
  });
});

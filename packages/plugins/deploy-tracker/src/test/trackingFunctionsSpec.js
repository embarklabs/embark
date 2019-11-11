/*globals describe, it*/
import TrackingFunctions from "../trackingFunctions";
const fs = require('fs-extra');
const sinon = require('sinon');
const expect = require('expect.js');
import {beforeEach, afterEach} from "mocha";
import { Logger } from "embark-logger";
import {dappPath} from 'embark-utils';
require("colors");

describe('embark.trackingFunctions', function () {
  let logger = new Logger({logLevel: 'error'});
  let events = {once: () => {}, setCommandHandler: () => {}, emit: () => {}, on: () => {}, request: () => {}};
  let readJSON;
  let trackingFunctions;
  let contractInChainsFake;
  let chainsFake;
  let contract;
  let trackedContract;
  let params;
  let chainsPath = dappPath(".embark/chains.json");
  let exists;
  let outputJSON;
  let writeJSON;

  beforeEach(() => {
    contract = {
      className: "SimpleStorage",
      deployedAddress: "0xbe474fb88709f99Ee83901eE09927005388Ab2F1",
      hash: "0x35e400a0b1817a3cfaf09eed53a76eaa169771f28c3630e23e6db2851d99a849"
    };
    params = {
      contract
    };
    trackedContract = {
      "name": "SimpleStorage",
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
    readJSON = sinon.stub(fs, 'readJSON').returns(chainsFake);
    exists = sinon.stub(fs, 'exists').returns(true);
    outputJSON = sinon.stub(fs, 'outputJSON');
    writeJSON = sinon.stub(fs, 'writeJSON');
    trackingFunctions = new TrackingFunctions({
      config: {
        contractsConfig: {
          tracking: undefined
        },
        env: "development"
      },
      fs,
      events,
      logger,
      trackContracts: true
    });
    trackingFunctions._web3 = {
      eth: {
        getBlock: () => {
          return {
            hash: "0x7aec9250dcc5f6bedc3d0d582e0be8b8d159a4d483c47309e122ba5702ec6a16"
          };
        }
      }
    };
  });
  afterEach(() => {
    readJSON.restore();
    exists.restore();
    outputJSON.restore();
    writeJSON.restore();
  });

  describe('#chains property', function () {

    it("should read chains.json", async function () {
      const chains = await trackingFunctions.chains;
      expect(readJSON.calledOnceWith(chainsPath)).to.be(true);
      expect(chains).to.equal(chainsFake);
    });

    it("enabled is false, should not read chains.json and return null", async function () {
      trackingFunctions.enabled = false;
      const chains = await trackingFunctions.chains;
      expect(readJSON.calledOnceWith(chainsPath)).to.be(false);
      expect(chains).to.be(null);
    });
    it("non-existant chains file path, should not read chains.json and return null", async function () {
      exists.restore();
      exists = sinon.stub(fs, 'exists').returns(false);
      const chains = await trackingFunctions.chains;
      expect(readJSON.calledOnceWith(chainsPath)).to.be(false);
      expect(chains).to.be(null);
    });
    it("trackContracts is false, should not read chains.json and return null", async function () {
      trackingFunctions = new TrackingFunctions({
        config: {
          contractsConfig: {
            tracking: undefined
          },
          env: "development"
        },
        fs,
        events,
        logger,
        trackContracts: false
      });
      const chains = await trackingFunctions.chains;
      expect(readJSON.calledOnceWith(chainsPath)).to.be(false);
      expect(chains).to.be(null);
    });
  });

  describe('#currentChain property', function () {
    it("should read chains.json for current chain", async function () {
      const currentChain = await trackingFunctions.currentChain;
      contractInChainsFake.name = "development";
      expect(currentChain).to.be.equal(contractInChainsFake);
    });

    it("should return null when not enabled", async function () {
      trackingFunctions.enabled = false;
      const currentChain = await trackingFunctions.currentChain;
      expect(currentChain).to.be(null);
    });

    it("should return a basic chain when there is no chains file", async function () {
      exists.restore();
      exists = sinon.stub(fs, 'exists').returns(false);
      const currentChain = await trackingFunctions.currentChain;
      expect(currentChain).to.eql({
        contracts: {},
        name: 'development'
      });
    });
  });

  describe('#getContract', function () {
    it("should return false when disabled", async function () {
      trackingFunctions.enabled = false;
      const returnedContract = await trackingFunctions.getContract(contract);
      expect(returnedContract).to.be.equal(false);
    });

    it("should return tracked contract", async function () {
      const trackedContractResult = await trackingFunctions.getContract(contract);
      expect(trackedContractResult).to.be.eql(trackedContract);
    });

    it("should return false when address is not tracked", async function () {
      readJSON.restore();
      readJSON = sinon.stub(fs, 'readJSON').returns({
        "0x7aec9250dcc5f6bedc3d0d582e0be8b8d159a4d483c47309e122ba5702ec6a16": {
          "contracts": {
            "0x35e400a0b1817a3cfaf09eed53a76eaa169771f28c3630e23e6db2851d99a849": {
              "name": "SimpleStorage"
            }
          }
        }
      });
      const returnedContract = await trackingFunctions.getContract(contract);
      expect(returnedContract).to.be.equal(false);
    });
  });

  describe('#trackAndSaveContract', function () {
    it("should not call trackContract when disabled", async function (done) {
      trackingFunctions.enabled = false;
      const trackContract = sinon.stub(trackingFunctions, "trackContract");
      await trackingFunctions.trackAndSaveContract(params, (err, _params) => {
        expect(err).to.be(undefined);
        expect(trackContract.called).to.be(false);
        done();
      });
    });

    it("should track contract when contract.track === false, but set track property to false", async function () {
      let {contract} = params;
      contract.track = false;
      const trackContract = sinon.spy(trackingFunctions, "trackContract");
      return trackingFunctions.trackAndSaveContract(params, (err, _params) => {
        expect(err).to.be(undefined);
        expect(trackContract.calledWith(contract)).to.be(true);
      });
    });

    it("should track contract and call save", async function () {
      const {contract} = params;
      const trackContract = sinon.spy(trackingFunctions, "trackContract");
      const save = sinon.spy(trackingFunctions, "save");
      return trackingFunctions.trackAndSaveContract(params, (err, _params) => {
        expect(err).to.be(undefined);
        expect(trackContract.calledWith(contract)).to.be(true);
        expect(save.called).to.be(true);
      });
    });
  });

  describe('#ensureChainTrackerFile', function () {
    it("should do nothing when disabled", async function () {
      trackingFunctions.enabled = false;
      exists.restore();
      exists = sinon.stub(fs, 'exists').returns(true);
      await trackingFunctions.ensureChainTrackerFile();
      expect(exists.called).to.be(false);
    });

    it("should create tracking file when not exists", async function () {
      exists.restore();
      exists = sinon.stub(fs, 'exists').returns(false);
      await trackingFunctions.ensureChainTrackerFile();
      expect(outputJSON.calledOnceWith(chainsPath, {
        "0x7aec9250dcc5f6bedc3d0d582e0be8b8d159a4d483c47309e122ba5702ec6a16": {
          contracts: {},
          name: "development"
        }
      })).to.be(true);
    });
  });

  describe('#trackContract', function () {
    it("should not track contract in memory when disabled", async function () {
      trackingFunctions.enabled = false;

      const trackContractResult = await trackingFunctions.trackContract();
      expect(trackContractResult).to.be(false);
    });

    it("should track contract in memory", async function () {
      contract = {
        className: "test",
        deployedAddress: "0x123",
        hash: "123abc"
      };
      await trackingFunctions.trackContract(contract);
      const currentChain = await trackingFunctions.currentChain;
      expect(currentChain.contracts["123abc"]).to.eql({
        name: "test",
        address: "0x123"
      });
      expect(currentChain.contracts["123abc"].track).to.be(undefined);
    });
    it("should track contract in memory with track === false", async function () {
      contract = {
        className: "test",
        deployedAddress: "0x123",
        hash: "123abc",
        track: false
      };
      await trackingFunctions.trackContract(contract);
      const currentChain = await trackingFunctions.currentChain;
      expect(currentChain.contracts["123abc"]).to.eql({
        name: "test",
        address: "0x123",
        track: false
      });
    });
  });

  describe('#save', function () {
    it("should not save when tracking is disabled", async function () {
      trackingFunctions.enabled = false;
      expect(writeJSON.called).to.be(false);
    });

    it("should not save when chains is null", async function () {
      exists.restore();
      exists = sinon.stub(fs, 'exists').returns(false);
      expect(writeJSON.called).to.be(false);
    });

    it("should save to chains.json", async function () {
      await trackingFunctions.save();
      expect(writeJSON.calledOnceWith(chainsPath, chainsFake, {spaces: 2})).to.equal(true);
    });

    it("should save to chains.json when track is false", async function () {
      params.contract.track = false;
      await trackingFunctions.trackContract(params.contract);
      await trackingFunctions.save();
      trackedContract.track = false;
      const expectedChains = chainsFake;
      expect(writeJSON.calledOnceWith(chainsPath, expectedChains, {spaces: 2})).to.equal(true);
    });
  });
});

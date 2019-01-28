/*globals describe, it, before*/
const {
  expect
} = require('chai');
const sinon = require('sinon');
let IPC = require('../lib/core/ipc.js');
let Proxy = require('../lib/modules/blockchain_process/proxy');
const constants = require('../lib/constants');

describe('embark.Proxy', function () {
  let ipc, proxy, ipcRequests;
  before(function () {
    ipc = new IPC({
      ipcRole: 'none'
    });
    ipcRequests = [];

    ipc.connected = true;
    sinon.stub(ipc, 'request').callsFake((...args) => {
      ipcRequests.push(args);
    });

    proxy = new Proxy(ipc);
  });

  describe('#trackRequest', function () {
    it('should handle eth_sendTransaction', function (done) {
      const to = "to";
      const data = "data";

      proxy.trackRequest({
        id: 1,
        method: constants.blockchain.transactionMethods.eth_sendTransaction,
        params: [{
          to: to,
          data: data
        }]
      });

      expect(proxy.commList[1]).to.deep.equal({
        type: 'contract-log',
        address: to,
        data: data
      });
      done();
    });

    it('should handle eth_sendRawTransaction', function (done) {
      const to = "0x2e6242a07ea1c4e79ecc5c69a2dccae19878a280";
      const data = "0x60fe47b1000000000000000000000000000000000000000000000000000000000000115c";

      proxy.trackRequest({
        id: 1,
        method: constants.blockchain.transactionMethods.eth_sendRawTransaction,
        params: ["0xf8852701826857942e6242a07ea1c4e79ecc5c69a2dccae19878a28080a460fe47b1000000000000000000000000000000000000000000000000000000000000115c820a96a04d6e3cbb86d80a75cd51da02bf8f0cc9893d64ca7956ce21b350cc143aa8a023a05878a850e4e7810d08093add07df405298280fdd901ecbabb74e73422cb5e0b0"]
      });

      expect(proxy.commList[1]).to.deep.equal({
        type: 'contract-log',
        address: to,
        data: data
      });
      done();
    });
  });

  describe('#trackResponse', function () {
    describe('when the response is a transaction', function () {
      before(function () {
        proxy.trackRequest({
          id: 1,
          method: constants.blockchain.transactionMethods.eth_sendTransaction,
          params: [{to: "to", data: "data" }]
        });
      });

      it('should populate the transaction when it is a known id', function (done) {
        proxy.trackResponse({
          id: 1,
          result: 1
        });

        expect(proxy.transactions[1]).to.deep.equal({
          commListId: 1
        });
        done();
      });

      it('should not populate the transaction when it is a unknown id', function (done) {
        proxy.trackResponse({
          id: 2
        });

        expect(proxy.transactions[2]).to.be.equal(undefined);
        done();
      });
    });

    describe('when the response is a receipt', function () {
      it('should make an ipc call', function (done) {
        proxy.trackRequest({
          id: 3,
          method: constants.blockchain.transactionMethods.eth_sendTransaction,
          params: [{
            to: "to",
            data: "data"
          }]
        });

        proxy.trackResponse({
          id: 3,
          result: {
            to: "to",
            data: "data"
          }
        });

        proxy.trackRequest({
          id: 4,
          method: constants.blockchain.transactionMethods.eth_getTransactionReceipt,
          params: [{
            to: "to",
            data: "data"
          }]
        });

        expect(proxy.receipts[4]).to.be.equal(3);

        proxy.trackResponse({
          id: 4,
          result: {
            blockNumber: 666,
            gasUsed: 122,
            status: 'ok'
          }
        });

        expect(ipcRequests[0]).to.deep.equal([
          "log", {
            "address": "to",
            "blockNumber": 666,
            "data": "data",
            "gasUsed": 122,
            "status": "ok",
            "transactionHash": {
              "data": "data",
              "to": "to"
            },
            "type": "contract-log"
          }
        ]);
        done();
      });
    });
  });
});

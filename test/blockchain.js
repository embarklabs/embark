/*globals describe, it*/
const Blockchain = require('../lib/cmds/blockchain/blockchain');

const assert = require('assert');

describe('embark.Blockchain', function () {
  //let Client = function() {};
  //Client.prototype.name = "ClientName";

  describe('#initializer', function () {
    //let client = new Client();

    describe('with empty config', function () {
      it('should have a default config', function (done) {
        let config = {
          networkType: 'custom',
          genesisBlock: false,
          geth_bin: 'geth',
          datadir: false,
          mineWhenNeeded: false,
          rpcHost: 'localhost',
          rpcPort: 8545,
          rpcApi: ['eth', 'web3', 'net'],
          rpcCorsDomain: false,
          networkId: 12301,
          port: 30303,
          nodiscover: false,
          maxpeers: 25,
          mine: false,
          vmdebug: false,
          whisper: true,
          account: {},
          bootnodes: ""
        };
        let blockchain = new Blockchain(config, 'geth');

        assert.deepEqual(blockchain.config, config);
        done();
      });
    });

    describe('with config', function () {
      it('should take config params', function (done) {
        let config = {
          networkType: 'livenet',
          genesisBlock: 'foo/bar/genesis.json',
          geth_bin: 'geth',
          datadir: '/foo/datadir/',
          mineWhenNeeded: true,
          rpcHost: 'someserver',
          rpcPort: 12345,
          rpcApi: ['eth', 'web3', 'net'],
          rpcCorsDomain: true,
          networkId: 1,
          port: 123456,
          nodiscover: true,
          maxpeers: 25,
          mine: true,
          vmdebug: false,
          whisper: false,
          account: {},
          bootnodes: ""
        };
        let blockchain = new Blockchain(config, 'geth');

        assert.deepEqual(blockchain.config, config);
        done();
      });
    });

  });
});

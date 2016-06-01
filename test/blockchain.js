var Config = require('../lib/config/config.js');
var Blockchain = require('../lib/blockchain.js');
var assert = require('assert');
var sinon = require('sinon');

describe('embark.blockchain', function() {
  var blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml').config("development");

  describe('#generate_basic_command', function() {
    var blockchain = new Blockchain(blockchainConfig);

    it('should return correct cmd', function() {
      assert.strictEqual(blockchain.generate_basic_command(), "geth --datadir=\"/tmp/embark\" --password config/password  --port 30303 --rpc --rpcport 8101 --rpcaddr localhost --networkid "+blockchainConfig.networkId+" --rpccorsdomain=\"*\" --minerthreads \"1\" --mine --rpcapi \"eth,web3\" --maxpeers 4 ");
    });
  });

  describe('#list_command', function() {
    var blockchain = new Blockchain(blockchainConfig);
    blockchain.generate_basic_command = sinon.stub().returns("geth ");

    it('should generate command to list accounts', function() {
      assert.equal(blockchain.list_command(), "geth --datadir=\"/tmp/embark\" --password config/password account list ");
    });
  });

  describe('#init_command', function() {
    var blockchain = new Blockchain(blockchainConfig);
    blockchain.generate_basic_command = sinon.stub().returns("geth ");

    it('should generate command to create an account', function() {
      assert.equal(blockchain.init_command(), "geth --datadir=\"/tmp/embark\" --password config/password account new ");
    });
  });

  describe('#run_command', function() {
    describe('with mine when needed config set', function() {
      var blockchain = new Blockchain(blockchainConfig);
      blockchain.generate_basic_command = sinon.stub().returns("geth ");

      it('should generate run command with script ', function() {
        assert.equal(blockchain.run_command(), "geth js node_modules/embark-framework/js/mine.js");
      });
    });
  });

});

/*global describe, it, before*/
const assert = require('assert');
let TestLogger = require('../lib/utils/test_logger');
const Web3 = require('web3');
const i18n = require('../lib/core/i18n/i18n.js');
const constants = require('../lib/constants.json');
const DevFunds = require('../lib/modules/blockchain_process/dev_funds');
const async = require('async');
const FakeIpcProvider = require('./helpers/fakeIpcProvider');
const utils = require('../lib/utils/utils');
i18n.setOrDetectLocale('en');

describe('embark.DevFunds', function() {
  let config = {
    networkType: 'livenet',
    genesisBlock: 'foo/bar/genesis.json',
    geth_bin: 'geth',
    datadir: '/foo/datadir/',
    mineWhenNeeded: true,
    rpcHost: 'someserver',
    rpcPort: 12345,
    rpcApi: ['eth', 'web3', 'net', 'debug'],
    rpcCorsDomain: true,
    networkId: 1,
    port: 123456,
    nodiscover: true,
    maxpeers: 25,
    mine: true,
    vmdebug: false,
    whisper: false,
    account: {
      password: './dist/test/test1/password',
      numAccounts: 3,
      // this conversion is normally done when constructing a Config object
      balance: utils.getWeiBalanceFromString("5 ether", Web3)
    },
    bootnodes: "",
    wsApi: ["eth", "web3", "net", "shh", "debug"],
    wsHost: "localhost",
    wsOrigins: false,
    wsPort: 8546,
    wsRPC: true,
    targetGasLimit: false,
    syncMode: undefined,
    verbosity: undefined,
    proxy: true
  };

  if (config.proxy) {
    config.wsPort += constants.blockchain.servicePortOnProxy;
    config.rpcPort += constants.blockchain.servicePortOnProxy;
  }

  describe('#create, fund, and unlock accounts', function() {
    let provider = new FakeIpcProvider();
    const web3 = new Web3(provider);
    let devFunds;

    before(async () => {
      provider.injectResult(['0x47d33b27bb249a2dbab4c0612bf9caf4c1950855']); // getAccounts: return --dev account
      devFunds = await DevFunds.new({blockchainConfig: config, provider: provider, logger: new TestLogger({})});
    });

    // TOCHECK: DevFunds does not provide this function anymore, please consider to remove this test
    it('should create correct number of accounts', function(done) {
      provider.injectResult('0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae'); // createAccount #1
      provider.injectResult('0x22f4d0a3c12e86b4b5f39b213f7e19d048276dab'); // createAccount #2

      devFunds.createAccounts(config.account.numAccounts, 'test_password', (err) => {
        assert.equal(err, null);

        // TODO: make FakeIpcProvider smart enough to keep track of created accounts
        provider.injectResult(['0x47d33b27bb249a2dbab4c0612bf9caf4c1950855', '0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae', '0x22f4d0a3c12e86b4b5f39b213f7e19d048276dab']);

        web3.eth.getAccounts().then((accts) => {
          assert.equal(accts.length, config.account.numAccounts);
          assert.strictEqual(accts[0], '0x47D33b27Bb249a2DBab4C0612BF9CaF4C1950855'); // --dev acct
          assert.strictEqual(accts[1], '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe'); // created acct #1
          assert.strictEqual(accts[2], '0x22F4d0A3C12E86b4b5F39B213f7e19D048276DAb'); // created acct #2
          done();
        });
      });
    });

    // TOCHECK: DevFunds does not provide this function anymore, please consider to remove this test
    it('should unlock accounts', function(done) {
      if (devFunds.accounts.length === 0) {
        assert.equal(true, true, "no accounts to unlock");
        return done();
      }

      devFunds.accounts.forEach(_acct => {
        provider.injectResult(true); // account unlock result
      });

      devFunds.unlockAccounts(devFunds.password, (errUnlock) => {
        assert.equal(errUnlock, null);
        done();
      });
    });

    it('should fund accounts', function(done) {

      if (devFunds.accounts.length === 0) {
        assert.equal(true, true, "no accounts to fund");
        return done();
      }
      devFunds.accounts.forEach(_acct => {
        provider.injectResult('1234567890'); // account balance
        // provider.injectResult('0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe'); // send tx response
      });

      devFunds.fundAccounts((errFundAccounts) => {
        assert.equal(errFundAccounts, null);

        // inject response for web3.eth.getAccounts
        // TODO: make FakeIpcProvider smart enough to keep track of created accounts
        provider.injectResult(['0x47d33b27bb249a2dbab4c0612bf9caf4c1950855', '0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae', '0x22f4d0a3c12e86b4b5f39b213f7e19d048276dab']);

        web3.eth.getAccounts().then((accts) => {

          const weiFromConfig = config.account.balance;

          async.each(accts, (acct, cb) => {

            // inject response for web3.eth.getBalance.
            // essentially, this will always return the amount we specified
            // in the config.
            // this is dodgy. really, we should be letting the FakeIpcProvider
            // at this point tell us how many wei we have per account (as it would
            // in a real node), but the FakeIpcProvider is not smart enough... yet.
            // TODO: make FakeIpcProvider smart enough to keep track of balances
            provider.injectResult(web3.utils.numberToHex(weiFromConfig));

            web3.eth.getBalance(acct).then((wei) => {
              assert.equal(wei, weiFromConfig);
              cb();
            }).catch(cb);

          }, function(errAcctsBalance) {
            if (errAcctsBalance) throw errAcctsBalance;
            done();
          });
        }).catch((errGetAccts) => {
          if (errGetAccts) throw errGetAccts;
          done();
        });
      });
    });
  });
});

/*global describe, it*/
const assert = require('assert');
let TestLogger = require('../lib/tests/test_logger.js');
const Web3 = require('web3');
const i18n = require('../lib/i18n/i18n.js');
const constants = require('../lib/constants.json');
const Test = require('../lib/tests/test');
const DevFunds = require('../lib/cmds/blockchain/dev_funds');
const async = require('async');
const FakeIpcProvider = require('./helpers/fakeIpcProvider');
const utils = require('../lib/utils/utils');
i18n.setOrDetectLocale('en');

describe('embark.DevFunds', function () {
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
      password: './test/test1/password',
      numAccounts: 3,
      balance: "5 ether"
    },
    bootnodes: "",
    wsApi: ["eth", "web3", "net", "shh", "debug"],
    wsHost: "localhost",
    wsOrigins: false,
    wsPort: 8546,
    wsRPC: true,
    targetGasLimit: false,
    syncMode: undefined,
    syncmode: undefined,
    verbosity: undefined,
    proxy: true
  };

  if (config.proxy) {
    config.wsPort += constants.blockchain.servicePortOnProxy;
    config.rpcPort += constants.blockchain.servicePortOnProxy;
  }

  // TODO put default config
  const test = new Test({ loglevel: 'trace' });


  test.initWeb3Provider((err) => {
    if (err) throw err;
    describe('#create, fund, and unlock accounts', function () {
      let provider = new FakeIpcProvider();
      let devFunds = new DevFunds(config, provider, new TestLogger({}));
      const web3 = new Web3(provider);

      it('should create correct number of accounts', function (done) {
        provider.injectResult(['0x47d33b27bb249a2dbab4c0612bf9caf4c1950855']); // getAccounts - return --dev account
        devFunds.getCurrentAccounts(() => {

          provider.injectResult('0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae'); // createAccount #1
          provider.injectResult('0x22f4d0a3c12e86b4b5f39b213f7e19d048276dab'); // createAccount #2


          devFunds.createAccounts(config.account.numAccounts, 'test_password', (err) => {
            assert.equal(err, null);

            provider.injectResult(['0x47d33b27bb249a2dbab4c0612bf9caf4c1950855', '0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae', '0x22f4d0a3c12e86b4b5f39b213f7e19d048276dab']);
            web3.eth.getAccounts().then((accts) => {
              console.log('got accts: ' + JSON.stringify(accts));
              assert.equal(accts.length, config.account.numAccounts);
              assert.strictEqual(accts[0], '0x47D33b27Bb249a2DBab4C0612BF9CaF4C1950855');
              assert.strictEqual(accts[1], '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe');
              assert.strictEqual(accts[2], '0x22F4d0A3C12E86b4b5F39B213f7e19D048276DAb');
              done();
            });
          });
        });
      });

      it('should fund accounts', function (done) {
        console.dir('funding accounts...');

        provider.injectResult('1234567890'); // account #1 balance
        provider.injectResult('1234567890'); // account #2 balance
        provider.injectResult('0xfff12345678976543213456786543212345675432'); // send tx #1
        provider.injectResult('0xfff12345678976543213456786543212345675433'); // send tx #2

        try {
          devFunds.fundAccounts(devFunds.balance, (err) => {
            console.dir('accounts funded...');
            assert.equal(err, null);

            provider.injectResult(['0x47d33b27bb249a2dbab4c0612bf9caf4c1950855', '0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae', '0x22f4d0a3c12e86b4b5f39b213f7e19d048276dab']);
            web3.eth.getAccounts().then((accts) => {
              console.log('got accts: ' + JSON.stringify(accts));

              const weiFromConfig = utils.getWeiBalanceFromString(config.account.balance);
              async.each(accts, (acct, cb) => {
                provider.injectResult(web3.utils.numberToHex(weiFromConfig));
                devFunds.web3.eth.getBalance(acct).then((wei) => {
                  assert.equal(wei, weiFromConfig);
                  cb();
                }).catch(cb);
              }, function(err) { done(); });
            }).catch(() => {
              done();
            });
          });
        } catch (errFundAccts) {
          throw errFundAccts;
        }
      });
    });
  });
});

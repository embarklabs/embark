/*global describe, it, before, after*/
const assert = require('assert');
const sinon = require('sinon');
const utils = require('../lib/utils/utils');
const AccountParser = require('../lib/utils/accountParser');
let TestLogger = require('../lib/utils/test_logger');
const Web3 = require('web3');
const i18n = require('../lib/core/i18n/i18n');
i18n.setOrDetectLocale('en');

describe('embark.AccountParser', function () {
  describe('#getAccount', function () {
    let web3;
    let testLogger;
    let isHexStrictStub;

    before(() => {
      testLogger = new TestLogger({});
      web3 = {
        eth: {
          accounts: {
            privateKeyToAccount: sinon.stub().callsFake((key) => {
              return {key};
            })
          }
        }
      };
      isHexStrictStub = sinon.stub(Web3.utils, 'isHexStrict').returns(true);
      // Web3.utils.isHexStrict = sinon.stub().returns(true);
    });

    after(() => {
      isHexStrictStub.restore();
    });

    it('should return one account with the key', function () {
      const account = AccountParser.getAccount({
        privateKey: 'myKey'
      }, web3, testLogger);

      assert.deepEqual(account, {key: '0xmyKey', hexBalance: null});
    });

    it('should return two accounts from the keys in the file', function () {
      const account = AccountParser.getAccount({
        privateKeyFile: 'dist/test/keyFiles/twoKeys'
      }, web3, testLogger);

      assert.deepEqual(account, [
        {key: '0xkey1', hexBalance: null},
        {key: '0xkey2', hexBalance: null}
      ]);
    });

    it('should return one account from the mnemonic', function () {
      const account = AccountParser.getAccount({
        mnemonic: 'example exile argue silk regular smile grass bomb merge arm assist farm'
      }, web3, testLogger);

      assert.deepEqual(account,
        [{key: "0xf942d5d524ec07158df4354402bfba8d928c99d0ab34d0799a6158d56156d986", hexBalance: null}]);
    });

    it('should return two accounts from the mnemonic using numAddresses', function () {
      const account = AccountParser.getAccount({
        mnemonic: 'example exile argue silk regular smile grass bomb merge arm assist farm',
        numAddresses: 2
      }, web3, testLogger);

      assert.deepEqual(account,
        [
          {key: "0xf942d5d524ec07158df4354402bfba8d928c99d0ab34d0799a6158d56156d986", hexBalance: null},
          {key: "0x88f37cfbaed8c0c515c62a17a3a1ce2f397d08bbf20dcc788b69f11b5a5c9791", hexBalance: null}
        ]);
    });

    it('should return nothing with bad config', function () {
      const account = AccountParser.getAccount({
        badConfig: 'not working'
      }, web3, testLogger);

      assert.strictEqual(account, null);
    });

    it('should just return the addresses when no web3', function () {
      const accounts = AccountParser.getAccount({
        mnemonic: 'example exile argue silk regular smile grass bomb merge arm assist farm',
        numAddresses: 2
      }, false, testLogger);

      assert.deepEqual(accounts,
        [
          "0xb8d851486d1c953e31a44374aca11151d49b8bb3",
          "0xf6d5c6d500cac10ee7e6efb5c1b479cfb789950a"
        ]);
    });

    it('should return nodeAccounts', function() {
      const accounts = AccountParser.getAccount({nodeAccounts: true}, web3, testLogger, [
        "0xb8d851486d1c953e31a44374aca11151d49b8bb3",
        "0xf6d5c6d500cac10ee7e6efb5c1b479cfb789950a"
      ]);

      assert.deepEqual(accounts,
        [
          {"address": "0xb8d851486d1c953e31a44374aca11151d49b8bb3"},
          {"address": "0xf6d5c6d500cac10ee7e6efb5c1b479cfb789950a"}
        ]);
    });
  });

  describe('getHexBalance', () => {
    it('should return default if no balance', () => {
      const hexBalance = utils.getHexBalanceFromString(null, Web3);

      assert.strictEqual(hexBalance, 0xFFFFFFFFFFFFFFFFFF);
    });

    it('should return the balance string if already hexadecimal', () => {
      const hexBalance = utils.getHexBalanceFromString('0xFFF', Web3);

      assert.strictEqual(hexBalance, '0xFFF');
    });

    it('should convert to hex when decimal', () => {
      const hexBalance = utils.getHexBalanceFromString('500', Web3);

      assert.strictEqual(hexBalance, '0x1f4');
    });

    it('should convert to hex with eth string', () => {
      const hexBalance = utils.getHexBalanceFromString('4ether', Web3);

      assert.strictEqual(hexBalance, '0x3782dace9d900000');
    });

    it('should convert to hex with eth string with space', () => {
      const hexBalance = utils.getHexBalanceFromString('673 shannon', Web3);

      assert.strictEqual(hexBalance, '0x9cb1ed0a00');
    });

    it('should convert to hex with large ether values', () => {
      const hexBalance = utils.getHexBalanceFromString('100000 ether', Web3);

      assert.strictEqual(hexBalance, '0x152d02c7e14af6800000');
    });

    it('should fail when string is not good', () => {
      try {
        utils.getHexBalanceFromString('nogood', Web3);
        assert.fail('Should have failed at getHexBalance');
      } catch (e) {
        // Ok
      }
    });
  });
  describe('getWeiBalance', () => {
    it('should convert to hex with large ether values', () => {
      const weiBalance = utils.getWeiBalanceFromString('100000 ether', Web3);

      assert.strictEqual(weiBalance, '100000000000000000000000');
    });

    it('should fail when string is not good', () => {
      try {
        utils.getWeiBalanceFromString('nogood', Web3);
        assert.fail('Should have failed at getWeiBalance');
      } catch (e) {
        // Ok
      }
    });
  });
});

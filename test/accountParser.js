/*global describe, it*/
const assert = require('assert');
const sinon = require('sinon');
const AccountParser = require('../lib/contracts/accountParser');
let TestLogger = require('../lib/tests/test_logger.js');

describe('embark.AccountParser', function () {
  describe('#getAccount', function () {
    const web3 = {
      eth: {
        accounts: {
          privateKeyToAccount: sinon.stub().callsFake((key) => {
            return {key};
          })
        }
      },
      utils: {
        isHexStrict: sinon.stub().returns(true)
      }
    };
    const testLogger = new TestLogger({});

    it('should return one account with the key', function () {
      const account = AccountParser.getAccount({
        privateKey: 'myKey'
      }, web3, testLogger);

      assert.deepEqual(account, {key: '0xmyKey'});
    });

    it('should return two accounts from the keys in the file', function () {
      const account = AccountParser.getAccount({
        privateKeyFile: 'test/keyFiles/twoKeys'
      }, web3, testLogger);

      assert.deepEqual(account, [
        {key: '0xkey1'},
        {key: '0xkey2'}
      ]);
    });

    it('should return one account from the mnemonic', function () {
      const account = AccountParser.getAccount({
        mnemonic: 'example exile argue silk regular smile grass bomb merge arm assist farm'
      }, web3, testLogger);

      assert.deepEqual(account,
        [{key: "0xf942d5d524ec07158df4354402bfba8d928c99d0ab34d0799a6158d56156d986"}]);
    });

    it('should return two accounts from the mnemonic using numAddresses', function () {
      const account = AccountParser.getAccount({
        mnemonic: 'example exile argue silk regular smile grass bomb merge arm assist farm',
        numAddresses: 2
      }, web3, testLogger);

      assert.deepEqual(account,
        [
          {key: "0xf942d5d524ec07158df4354402bfba8d928c99d0ab34d0799a6158d56156d986"},
          {key: "0x88f37cfbaed8c0c515c62a17a3a1ce2f397d08bbf20dcc788b69f11b5a5c9791"}
        ]);
    });

    it('should return nothing with bad config', function () {
      const account = AccountParser.getAccount({
        badConfig: 'not working'
      }, web3, testLogger);

      assert.strictEqual(account, null);
    });

  });
});

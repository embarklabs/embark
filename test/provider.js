/*global describe, it, before*/
const assert = require('assert');
const sinon = require('sinon');
const Provider = require('../lib/core/provider');
let TestLogger = require('../lib/tests/test_logger.js');

describe('embark.provider', function () {
  describe('#getAccount', function () {
    let provider;

    before(() => {
      const web3 = {
        eth: {
          accounts: {
            privateKeyToAccount: sinon.stub().callsFake((key) => {
              return {key};
            })
          }
        }
      };

      provider = new Provider({
        accountsConfig: [],
        logger: new TestLogger({}),
        web3Endpoint: 'http:localhost:555',
        web3
      });
    });

    it('should return one account with the key', function () {
      const account = provider.getAccount({
        privateKey: 'myKey'
      });

      assert.deepEqual(account, {key: '0xmyKey'});
    });

    it('should return two accounts from the keys in the file', function () {
      const account = provider.getAccount({
        privateKeyFile: 'test/keyFiles/twoKeys'
      });

      assert.deepEqual(account, [
        {key: '0xkey1'},
        {key: '0xkey2'}
      ]);
    });

    it('should return one account from the mnemonic', function () {
      const account = provider.getAccount({
        mnemonic: 'example exile argue silk regular smile grass bomb merge arm assist farm'
      });


      assert.deepEqual(account,
        [{key: Buffer.from('f942d5d524ec07158df4354402bfba8d928c99d0ab34d0799a6158d56156d986', 'hex')}]);
    });

    it('should return two accounts from the mnemonic using numAddresses', function () {
      const account = provider.getAccount({
        mnemonic: 'example exile argue silk regular smile grass bomb merge arm assist farm',
        numAddresses: 2
      });

      assert.deepEqual(account,
        [
          {key: Buffer.from('f942d5d524ec07158df4354402bfba8d928c99d0ab34d0799a6158d56156d986', 'hex')},
          {key: Buffer.from('88f37cfbaed8c0c515c62a17a3a1ce2f397d08bbf20dcc788b69f11b5a5c9791', 'hex')}
        ]);
    });

    it('should return nothing with bad config', function () {
      const account = provider.getAccount({
        badConfig: 'not working'
      });

      assert.strictEqual(account, null);
    });

  });
});

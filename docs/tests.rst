Testing Ethereum Contracts
==========================

You can run specs with ``embark test``, it will run any test files under
``test/``.

Embark includes a testing lib to fastly run & test your contracts in a
EVM.

.. code:: javascript

    # test/simple_storage_spec.js

    var assert = require('assert');
    var Embark = require('embark');
    var EmbarkSpec = Embark.initTests();
    var web3 = EmbarkSpec.web3;

    describe("SimpleStorage", function() {
      before(function(done) {
        var contractsConfig = {
          "SimpleStorage": {
            args: [100]
          }
        };
        EmbarkSpec.deployAll(contractsConfig, done);
      });

      it("should set constructor value", function(done) {
        SimpleStorage.storedData(function(err, result) {
          assert.equal(result.toNumber(), 100);
          done();
        });
      });

      it("set storage value", function(done) {
        SimpleStorage.set(150, function() {
          SimpleStorage.get(function(err, result) {
            assert.equal(result.toNumber(), 150);
            done();
          });
        });
      });

    });

Embark uses `Mocha <http://mochajs.org/>`__ by default, but you can use
any testing framework you want.

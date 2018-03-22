Testing Ethereum Contracts
==========================

You can run specs with ``embark test``, it will run all the test files under
``test/``. You can run a specific test file with ``embark test <path/test_filename.js>

Embark includes a testing lib to fastly run & test your contracts in a
EVM.

.. code:: javascript

    # test/simple_storage_spec.js
    describe("SimpleStorage", function() {
      this.timeout(0);
      before(function(done) {
        var contractsConfig = {
          "SimpleStorage": {
            args: [100]
          }
        };
        EmbarkSpec.deployAll(contractsConfig, (accounts) => {
          done();
        });
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

**configuring accounts**

You can use a mnemonic to always use a specific account for testing purposes

.. code:: javascript

    # test/simple_storage_spec.js

    config({
      mnemonic: "labor ability deny divide mountain buddy home client type shallow outer pen"
    })

    describe("SimpleStorage", function() {
      ....

**configuring node**

By default Embark will use an internal VM to run the tests, however you can also
specify a node to connect to and run the tests there.

.. code:: javascript

    # test/simple_storage_spec.js

    config({
      node: "http://localhost:8545"
    })

    describe("SimpleStorage", function() {
      ....

**testing with any testing framework**

Embark uses `Mocha <http://mochajs.org/>`__ by default, but you can use
any testing framework you want. To do this you can require Embark as a library
and initialize the testing functionality. Below is an example using mocha:

.. code:: javascript

    # test/simple_storage_spec.js

    var assert = require('assert');
    var Embark = require('embark');
    var EmbarkSpec = Embark.initTests();
    var web3 = EmbarkSpec.web3;

    describe("SimpleStorage", function() {
      this.timeout(0);
      before(function(done) {
        var contractsConfig = {
          "SimpleStorage": {
            args: [100]
          }
        };
        EmbarkSpec.deployAll(contractsConfig, (accounts) => {
          done();
        });
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

``mocha test/simple_storage_spec.js --no-timeouts``

**accessing accounts**

The callback used in the function ``deployAll`` will let you access the accounts configured in the EVM. 
You can assign them to a variable and use them in your tests.

.. code:: javascript

    var accountArr;
    EmbarkSpec.deployAll(contractsConfig, (accounts) => {
      accountArr = accounts;
      done();
    });

**creating contract instances in your tests**

Embark handles the deployment of your contracts through the function ``deployAll``. 
However you can use ``web3.eth.contract`` for creating instances of your contracts manually.

.. code:: javascript

    var simpleStorageJson = require('../dist/contracts/SimpleStorage.json');
    var accountArr;
    var simpleStorage;
    
    describe("SimpleStorage", function() {
      this.timeout(0);
      before(function(done) {
        EmbarkSpec.deployAll({}, (accounts) => {
          accountArr = accounts;
          done();
        });
      });
    
      it("should deploy a contract instance", function(done) {
        var simpleStorageContract = new web3.eth.Contract(simpleStorageJson.abi);
        simpleStorageContract.deploy({data: simpleStorageJson.code, arguments: [100]})
          .send({from: accountArr[0], gas: 5000000, gasPrice: 1})
          .then(function(contractInstance){
            simpleStorage = contractInstance;
            simpleStorage.setProvider(web3.currentProvider);
            assert(simpleStorage.options.address != null);
           })
          .finally(done);
      });
    });

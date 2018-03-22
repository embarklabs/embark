Configuring & Using Contracts
=============================

Embark will automatically take care of deployment for you and set all
needed JS bindings. For example, the contract below:

.. code:: javascript

    # app/contracts/simple_storage.sol
    contract SimpleStorage {
      uint public storedData;

      function SimpleStorage(uint initialValue) {
        storedData = initialValue;
      }

      function set(uint x) {
        storedData = x;
      }
      function get() constant returns (uint retVal) {
        return storedData;
      }
    }

Will automatically be available in Javascript as:

.. code:: javascript

    # app/js/index.js
    import SimpleStorage from 'Embark/contracts/SimpleStorage';

    SimpleStorage.methods.set(100).send();
    SimpleStorage.methods.get().call().then(function(value) { console.log(value) });
    SimpleStorage.methods.storedData().call().then(function(value) { console.log(value) });

You can specify for each contract and environment its gas costs and
arguments:

.. code:: json

    # config/contracts.json
    {
      "development": {
        "gas": "auto",
        "contracts": {
          "SimpleStorage": {
            "args": [
              100
            ],
            "gas": 800000,
            "gasPrice": 5
          }
        }
      }
    }

If you are using multiple contracts, you can pass a reference to another
contract as ``$ContractName``, Embark will automatically replace this
with the correct address for the contract.
You can also specify interfaces and choose to not deploy contracts (for e.g in case they are interfaces)

.. code:: json

    # config/contracts.json
    {
      ...
      "development": {
        "contracts": {
          "SimpleStorage": {
            "args": [
              100,
              "$MyStorage"
            ]
          },
          "MyStorage": {
            "args": [
              "initial string"
            ]
          },
          "MyMainContract": {
            "args": [
              "$SimpleStorage"
            ]
          },
          "MyContractInteface": {
            "deploy": false
          }
        }
      }
      ...
    }

You can now deploy many instances of the same contract. e.g

.. code:: json

    # config/contracts.json
    {
      "development": {
        "contracts": {
          "Currency": {
            "deploy": false,
            "args": [
              100
            ]
          },
          "Usd": {
            "instanceOf": "Currency",
            "args": [
              200
            ]
          },
          "MyCoin": {
            "instanceOf": "Currency",
            "args": [
              200
            ]
          }
        }
      }
    }
      ...

Account from which you want to deploy a contract can be specified using "from" or "fromIndex" parameters.

| "from" - should be account address string.
| "fromIndex" - should be index in accounts array as retrieved by web3.eth.getAccounts() .

If both "from" and "fromIndex" are specified, the "from" will be used.

Example:

      .. code:: json

          # config/contracts.json
          {
            "development": {
              "contracts": {
                "Currency": {
                  "deploy": true,
                  "from": '0xfeedaa0e295b09cd84d6ea2cce390eb443bcfdfc',
                  "args": [
                    100
                  ]
                },
                "MyStorage": {
                  "fromIndex": 0,
                  "args": [
                    "initial string"
                  ]
                },
              }
            }
          }
            ...

Contracts addresses can be defined, If an address is defined the
contract wouldn't be deployed but its defined address will be used
instead.

.. code:: json

    # config/contracts.json
    {
      ...
      "development": {
        "contracts": {
          "UserStorage": {
            "address": "0x123456"
          },
          "UserManagement": {
            "args": [
              "$UserStorage"
            ]
          }
        }
      }
      ...
    }

You can specify actions to do after the deployment of a contract using the "onDeploy" parameter.

| "onDeploy" - should be an array of javascript instructions that will be evaluated and executed

.. code:: json

    # config/contracts.json
    {
      "development": {
        "gas": "auto",
        "contracts": {
          "SimpleStorage": {
            "args": [
              100
            ],
            "onDeploy": ["SimpleStorage.methods.set(150).send()"]
          }
        }
      }
    }
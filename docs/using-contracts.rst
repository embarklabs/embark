Configuring & Using Contracts
===============

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
    SimpleStorage.set(100);
    SimpleStorage.get().then(function(value) { console.log(value.toNumber()) });
    SimpleStorage.storedData().then(function(value) { console.log(value.toNumber()) });

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
            ]
          }
        }
      }
    }

If you are using multiple contracts, you can pass a reference to another
contract as ``$ContractName``, Embark will automatically replace this
with the correct address for the contract.

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

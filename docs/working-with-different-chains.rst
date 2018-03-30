Working with different chains
=============================

You can specify which environment to deploy to:

``$ embark blockchain livenet``

``$ embark run livenet``

The environment is a specific blockchain configuration that can be
managed at config/blockchain.json

.. code:: json

    # config/blockchain.json
      ...
       "livenet": {
         "networkType": "livenet",
         "rpcHost": "localhost",
         "rpcPort": 8545,
         "rpcCorsDomain": "http://localhost:8000",
         "account": {
           "password": "config/livenet/password"
         },
         "targetGasLimit": 8000000,
         "wsOrigins": "http://localhost:8000",
         "wsRPC": true,
         "wsHost": "localhost",
         "wsPort": 8546,
         "simulatorMnemonic": "example exile argue silk regular smile grass bomb merge arm assist farm",
         "simulatorBlocktime": 0
      },
      ...

**Specify a genesis block**

You can specify a genesis block for each environment if you so wish. This can be
useful to establish some initial balances and specific conditions such as the
gasLimit

.. code:: json

    # config/blockchain.json
      ...
       "development": {
         "genesisBlock": "config/development/genesis.json",
         "account": {
           "password": "config/livenet/password"
         }
      },
      ...

    # config/development/genesis.json
     {
        "config": {
          "homesteadBlock": 0,
          "byzantiumBlock": 0,
          "daoForkSupport": true
        },
        "nonce": "0x0000000000000042",
        "difficulty": "0x0",
        "alloc": {
            "0x3333333333333333333333333333333333333333": {"balance": "15000000000000000000"}
        },
        "mixhash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "coinbase": "0x3333333333333333333333333333333333333333",
        "timestamp": "0x00",
        "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "extraData": "0x",
        "gasLimit": "0x7a1200"
      }


Configuring Storage (IPFS)
==========================

Embark will check your prefered storage configuration in the file ``config/storage.json``. This file will contain the prefered configuration for each environment. With ``default`` being the configuration fields that applies to every environment. Each of those can be individually overriden in a per environment basis.

e.g :

.. code:: javascript

    {
      "default": {
        "enabled": true,
        "ipfs_bin": "ipfs",
        "provider": "ipfs",
        "available_providers": ["ipfs"],
        "host": "localhost",
        "port": 5001
      },
      "development": {
        "enabled": true,
        "provider": "ipfs",
        "host": "localhost",
        "port": 5001
      }
    }

options available:
  * ``enabled`` (boolean: true/false) to enable or completly disable storage support
  * ``ipfs_bin`` (string) name or desired path to the ipfs binary
  * ``provider`` (string: "ipfs") desired provider to automatically connect to on the dapp. e.g in the example above, seting this to ``"ipfs"`` will automaticaly add ``EmbarkJS.setProvider('ipfs', {server: 'localhost', 5001})`` to the generated code
  * ``available_providers`` (array: ["ipfs"]) list of storages to be supported on the dapp. This will affect what's available with the EmbarkJS library on the dapp.
  * ``host`` and ``port`` of the ipfs node to connect to.


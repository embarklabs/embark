Creating a new DApp
===================

If you want to create a blank new app.

.. code:: bash

    $ embark new AppName
    $ cd AppName

DApp Structure
==============

.. code:: bash

      app/
        |___ contracts/ #solidity or serpent contracts
        |___ html/
        |___ css/
        |___ js/
      config/
        |___ blockchain.json #environments configuration
        |___ contracts.json  #contracts configuration
      test/
        |___ #contracts tests

Solidity/Serpent files in the contracts directory will automatically be
deployed with embark run. Changes in any files will automatically be
reflected in app, changes to contracts will result in a redeployment and
update of their JS Bindings

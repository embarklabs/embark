Usage
=====

Usage - Demo
============

You can easily create a sample working DApp with the following:

.. code:: bash

    $ embark demo
    $ cd embark_demo

You can run a REAL ethereum node for development purposes:

.. code:: bash

    $ embark blockchain

Alternatively, to use an ethereum rpc simulator simply run:

.. code:: bash

    $ embark simulator

By default embark blockchain will mine a minimum amount of ether and
will only mine when new transactions come in. This is quite usefull to
keep a low CPU. The option can be configured at
``config/blockchain.json``. Note that running a real node requires at
least 2GB of free ram, please take this into account if running it in a
VM.

Then, in another command line:

.. code:: bash

    $ embark run

This will automatically deploy the contracts, update their JS bindings
and deploy your DApp to a local server at http://localhost:8000

Note that if you update your code it will automatically be re-deployed,
contracts included. There is no need to restart embark, refreshing the
page on the browser will do.

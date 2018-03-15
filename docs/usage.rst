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

embark run options
============

**Dashboard**

* ``--nodashboard`` - simple mode, disables the dashboard
* ``--no-color`` - no colors in case it's needed for compatbility purposes

**Web Server**

* ``-p [port]`` or ``--port [port]`` - port to run the dev webserver (default: 8000)
* ``-b [host]`` or ``--host [host]`` - host to run the dev webserver (default: localhost)
* ``--noserver`` - disable the development webserver

**Log File**

* ``--logfile [logfile]`` - filename to output logs (default: none)

embark simulator options
============

**RPC Server**

* ``-p [port]`` or ``--port [port]`` - port to run the rpc simulator (default: 8545)
* ``-b [host]`` or ``--host [host]`` - host to run the rpc simulator (default: localhost)

**Other Options**

* ``--accounts [numAccounts]`` - number of accounts (default: 10)
* ``--defaultBalanceEther [balance]`` - Amount of ether to assign each test account (default: 100)
* ``--gasLimit [gasLimit]`` - custom gas limit (default: 8000000)


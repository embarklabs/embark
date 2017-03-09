Installation
============

Requirements: geth (1.5.8 or higher), node (6.9.1 or higher is recommended) and npm
serpent (develop) if using contracts with Serpent, testrpc (3.0 or higher) 
if using the simulator or the test functionality. Further: depending on
the dapp stack you choose: `IPFS <https://ipfs.io/>`__

.. code:: bash

    $ npm -g install embark

    # If you plan to use the simulator instead of a real ethereum node.
    $ npm -g install ethereumjs-testrpc

See `Complete Installation
Instructions <https://github.com/iurimatias/embark-framework/wiki/Installation>`__.

**updating from embark 1**

Embark's npm package has changed from ``embark-framework`` to
``embark``, this sometimes can create conflicts. To update first
uninstall embark-framework 1 to avoid any conflicts.
``npm uninstall -g embark-framework`` then ``npm install -g embark``

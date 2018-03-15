Dashboard
=========

Embark 2 comes with a terminal dashboard.

.. figure:: http://i.imgur.com/s4OQZpu.jpg
   :alt: Dashboard

   Dashboard

The dashboard will tell you the state of your contracts, the enviroment
you are using, and what embark is doing at the moment.

**available services**

Available Services will display the services available to your dapp in
green, if one of these is down then it will be displayed in red.

**logs and console**

There is a console at the bottom which can be used to interact with
contracts or with embark itself. type ``help`` to see a list of
available commands, more commands will be added with each version of
Embark.

**without the dashboard**

if you prefer to only see the logs, you can disable the dashboard with the
nodashboard option ``embark run --nodashboard``

Console
=========

There is a console at the bottom which can be used to interact with
contracts or with embark itself. type ``help`` to see a list of
available commands, more commands will be added with each version of
Embark.

After contract deployment, you should be able to interact with the web3 object and the deployed contracts.
Some commands available include:

* ``version`` - see list of software & libraries and their respective versions
* ``quit`` or ``exit`` - to immediatly exit (you can also use ctrl + c)
* ``webserver start`` - start the dev webserver
* ``webserver stop`` - stop the dev webserver


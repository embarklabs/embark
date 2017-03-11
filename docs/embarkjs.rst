EmbarkJS
========

EmbarkJS is a javascript library meant to abstract and facilitate the
development of DApps.

**promises**

methods in EmbarkJS contracts will be converted to promises.

.. code:: javascript

      var myContract = new EmbarkJS.Contract({abi: abiObject, address: "0x123"});
      myContract.get().then(function(value) { console.log("value is " + value.toNumber) });

**deployment**

Client side deployment will be automatically available in Embark for
existing contracts:

.. code:: javascript

      SimpleStorage.deploy([args], {options}).then(function(anotherSimpleStorage) {});

or it can be manually definied as

.. code:: javascript

      var myContract = new EmbarkJS.Contract({abi: abiObject, code: code});
      myContract.deploy([args], {options}).then(function(anotherMyContractObject) {});

so you can define your gas as

.. code:: javascript

      myContract.deploy([100, "seconde argument"], {gas: 800000}).then(function(anotherMyContractObject) {});

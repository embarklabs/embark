EmbarkJS - Storage (IPFS)
=========================

**initialization**

The current available storage is IPFS. it can be initialized as

.. code:: javascript

      EmbarkJS.Storage.setProvider('ipfs',{server: 'localhost', port: '5001'})

**Saving Text**

.. code:: javascript

      EmbarkJS.Storage.saveText("hello world").then(function(hash) {});

**Retrieving Data/Text**

.. code:: javascript

      EmbarkJS.Storage.get(hash).then(function(content) {});

**Uploading a file**

.. code:: html

      <input type="file">

.. code:: javascript

      var input = $("input[type=file"]);
      EmbarkJS.Storage.uploadFile(input).then(function(hash) {});

**Generate URL to file**

.. code:: javascript

      EmbarkJS.Storage.getUrl(hash);

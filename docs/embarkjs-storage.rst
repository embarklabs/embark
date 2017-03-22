EmbarkJS - Storage (IPFS)
=========================

**initialization**

The current available storage is IPFS. it can be initialized as

.. code:: javascript

      EmbarkJS.Storage.setProvider('ipfs',{server: 'localhost', port: '5001'})

**Saving Text**

.. code:: javascript

      EmbarkJS.Storage.saveText("hello world")
        .then(function(hash) {})
        .catch(function(err) {
            if(err){
              console.log("IPFS saveText Error => " + err.message);
            }
        });

**Retrieving Data/Text**

.. code:: javascript

      EmbarkJS.Storage.get(hash)
        .then(function(content) {})
        .catch(function(err) {
            if(err){
              console.log("IPFS get Error => " + err.message);
            }
        });

**Uploading a file**

.. code:: html

      <input type="file">

.. code:: javascript

      var input = $("input[type=file"]);
      EmbarkJS.Storage.uploadFile(input)
        .then(function(hash) {})
        .catch(function(err) {
            if(err){
              console.log("IPFS uploadFile Error => " + err.message);
            }
        });

**Generate URL to file**

.. code:: javascript

      EmbarkJS.Storage.getUrl(hash);

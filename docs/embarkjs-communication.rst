EmbarkJS - Communication (Whisper, Orbit)
=========================================

**initialization**

For Whisper:

.. code:: javascript

        EmbarkJS.Messages.setProvider('whisper')

For Orbit:

You'll need to use IPFS from master and run it as:
``ipfs daemon --enable-pubsub-experiment``

then set the provider:

.. code:: javascript

      EmbarkJS.Messages.setProvider('orbit', {server: 'localhost', port: 5001})

**listening to messages**

.. code:: javascript

      EmbarkJS.Messages.listenTo({topic: ["topic1", "topic2"]}).then(function(message) { console.log("received: " + message); })

**sending messages**

you can send plain text

.. code:: javascript

      EmbarkJS.Messages.sendMessage({topic: "sometopic", data: 'hello world'})

or an object

.. code:: javascript

      EmbarkJS.Messages.sendMessage({topic: "sometopic", data: {msg: 'hello world'}})

note: array of topics are considered an AND. In Whisper you can use
another array for OR combinations of several topics e.g
``["topic1", ["topic2", "topic3"]]`` =>
``topic1 AND (topic2 OR topic 3)``

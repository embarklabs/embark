title: Sending and Receiving messages
layout: docs
---

### listening to messages

<pre><code class="javascript">EmbarkJS.Messages.listenTo({topic: ["topic1", "topic2"]}).then(function(message) {
  console.log("received: " + message);
})
</code></pre>

### sending messages

You can send plain text

<pre><code class="javascript">EmbarkJS.Messages.sendMessage({topic: "sometopic", data: 'hello world'})
</code></pre>

Or an object

<pre><code class="javascript">EmbarkJS.Messages.sendMessage({topic: "sometopic", data: {msg: 'hello world'}})
</code></pre>

Note: array of topics are considered an AND. In Whisper you can use another array for OR combinations of several topics e.g ``["topic1", ["topic2", "topic3"]]`` => ``topic1 AND (topic2 OR topic 3)``

### Setup

By default Embark will automatically initialize EmbarkJS with the provider configured at `config/communication.js`. However if you are using EmbarkJS directly or wish to change the provider configuration on the fly you can do:

<pre><code class="javascript">EmbarkJS.Messages.setProvider('whisper')
</code></pre>



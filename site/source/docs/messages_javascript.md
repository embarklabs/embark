title: Messages in JavaScript
layout: docs
---

Embark's companion library EmbarkJS comes with some convenient APIs to easily subscribe to and sending messages using messages protocols like Whisper. In this guide we'll take a closer look how this works.

Make sure to read our guide in [using EmbarkJS](/docs/javascript.html) first.

## Setting up EmbarkJS

By default Embark will initialize EmbarkJS with the provider configured at `config/communication.js`. However if we are using EmbarkJS directly or wish to change the provider configuration at runtime, we can do so using the `setProvider()` method:

```
EmbarkJS.Messages.setProvider('whisper')
```

## Listening to messages

We can subscribe to channels using the `listenTo()` method by specifying a list of channel topics like this:

```
EmbarkJS.Messages.listenTo({
  topic: ['topic1', 'topic2']
}).subscribe(message {
  console.log('received: ' + message);
});
```

`listenTo()` returns an Observable that we can subscribe to. Observables work great if multiple values can be emitted over time, which is exactly the case for messages being emitted with Whisper. In other words, this is a long-living Observable, so it's important to unsubscribe from it once we're no longer interested in the data. Otherwise we'll introduce memory leaks.

## Sending messages

Sending messages can be done using the `sendMessage()` method and it's entirely up to use whether we want to send plain text messages or even objects.


Here's how to send a plain text message to the `sometopic` topic:

```
EmbarkJS.Messages.sendMessage({
  topic: 'sometopic',
  data: 'hello world'
});
```

And this code snippet shows how to send an object structure:

```
EmbarkJS.Messages.sendMessage({
  topic: 'sometopic',
  data: { msg: 'hello world' }
});
```

Notice that a topic/channel name has to be at least 4 characters long. Whisper will otherwise emit an error on the subscription.

{% notification info 'On topic arrays:' %}
Array of topics are considered an AND. In Whisper you can use another array for OR combinations of several topics e.g `["topic1", ["topic2", "topic3"]]` => `topic1 AND (topic2 OR topic 3)`.
{% endnotification %}


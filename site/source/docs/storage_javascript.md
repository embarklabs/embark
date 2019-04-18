title: Storage APIs in JavaScript
layout: docs
---

As mentioned in our guide on [Using EmbarkJS](/docs/javascript_usage.html), Embark's companion JavaScript library EmbarkJS comes with APIs specifically designed to make working with decentralized Storages a breeze. Let's a have closer look at what `EmbarkJS.Storage` has to offer.

## Setting up EmbarkJS

By default Embark will automatically initialize EmbarkJS with the provider configured at `config/storage.js`. However if we are using EmbarkJS directly or wish to change the provider configuration at run time, we can do so using the `setProvider()` method:

```
EmbarkJS.Storage.setProvider('swarm', options);
```

Options are optional and if provided, will override the values in `storage.js`. Here's what a manual configuration could look like:

```
EmbarkJS.Storage.setProvider('ipfs', {
  server: 'localhost',
  port: '5001'
});

// OR

EmbarkJS.Storage.setProvider('swarm', {
  server: 'swarm-gateways.net',
  port: '80'
});
```

## Saving text data

String data can be easily uploaded to the configured storage using `EmbarkJS.Storage.saveText()`. This method takes any string and returns a Promise that resolves with a storage hash that can then be used to retrieve the data:

```
EmbarkJS.Storage
  .saveText("hello world").then(hash => {
    ...
  });
```

## Retrieving text data

If we happen to have a storage hash, we can use to to retrieve the data that's associated to it using `EmbarkJS.Storage.get()` as shown below. Just like `saveText()` this method returns a Promise and resolves with the data the hash points to:

```
EmbarkJS.Storage.get(hash).then(content =>  {
  ...
});
```

## Upload binary data

We can upload files as binary data using EmbarkJS as well. All we need is a reference to a DOM object of type `input[type=file]` and pass it the `uploadFile()` method. So assuming we had an input that looked something like this:

```
<input type="file">
```

We can upload its data like this: 
```
const input = document.querySelector('input[type=file"]');

EmbarkJS.Storage.uploadFile(input).then(hash => {
  ...    
})
```

Similar to `saveText()` and `get()`, this method returns a Promise and can be used with JavaScript's `async/await` syntec as well.

## Display data using URLs

To display any uploaded data in the browser, we can request a fully qualified URL using `EmbarkJS.Storage.getUrl()` and a dedicated storage hash:

```
EmbarkJS.Storage.getUrl(hash).then(url => {
  ...
});
```

## Checking for storage provider availability

We can check whether our configured storage provider is available or not using `isAvailable()`. This method resolves with either `true` or `false` depending on whether the service is available:

```
EmbarkJS.Storage.isAvailable().then(isAvailable => { 
  ...
});
```

## IPNS registration

We can register IPFS hashes using IPNS using the `register()` method has shown below:

```
EmbarkJS.Storage.register(some_hash).then(name => {
  console.log('Registred: ', name);
});
```

{% notification info 'Note on registering hashes:' %}
Registering a hash with IPFS can take a bit of time, so keep that in mind when relying on these APIs.
{% endnotification %}

And of course, we can resolve hashes to their IPFS paths as well, using the `resolve()` method:

```Javascript
EmbarkJS.Storage.resolve(some_hash).then(name => {
  console.log('Resolved ', name);
});
```


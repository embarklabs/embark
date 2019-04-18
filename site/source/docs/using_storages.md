title: Using Storages
layout: docs
---

### Save Text/Data

<pre><code class="javascript">EmbarkJS.Storage.saveText("hello world")
  .then(function(hash) {})
  .catch(function(err) {
      if(err){
        console.log("IPFS saveText Error => " + err.message);
      }
  });
</code></pre>

### Retrieve Text/Data

<pre><code class="javascript">EmbarkJS.Storage.get(hash)
  .then(function(content) {})
  .catch(function(err) {
      if(err){
        console.log("IPFS get Error => " + err.message);
      }
  });
</code></pre>

### Upload a file

<pre><code class="xml">&lt;input type=&quot;file&quot;&gt;
</code></pre>
<br>
<pre><code class="javascript">var input = $("input[type=file"]);
EmbarkJS.Storage.uploadFile(input)
  .then(function(hash) {})
  .catch(function(err) {
      if(err){
        console.log("IPFS uploadFile Error => " + err.message);
      }
  });
</code></pre>

### Display a file

<pre><code class="javascript">EmbarkJS.Storage.getUrl(hash);
</code></pre>

### Check for storage provider availability
This will return true if the storage provider (IPFS or Swarm) is available and running. 

<pre><code class="javascript">EmbarkJS.Storage.isAvailable()
  .then(isAvailable => { alert(`The storage provider is: ${isAvailable ? 'available' : 'not available'}`) })
  .catch(function(err) {
      if(err){
        console.log("Error getting storage provider availability => " + err.message);
      }
  });
</code></pre>

### Setup

By default Embark will automatically initialize EmbarkJS with the provider configured at `config/storage.js`. However if you are using EmbarkJS directly or wish to change the provider configuration on the fly you can do:

<pre><code class="javascript">EmbarkJS.Storage.setProvider('swarm', options);
</code></pre>

Options are optional and if provided, will override the values in `storage.js`. 

For example,
<pre><code class="javascript">EmbarkJS.Storage.setProvider('ipfs', {server: 'localhost', port: '5001'});
// OR
EmbarkJS.Storage.setProvider('swarm', {server: 'swarm-gateways.net', port: '80'});
</code></pre>

### IPNS registration

You can register your IPFS hash using IPNS.

*It can take up to a minute to register.

#### IPNS - Register

```Javascript
EmbarkJS.Storage.register('IPFS_hash', (err, name) => {
    if(err){
        console.log("Error registering", err.message);
        return;
    }
    console.log('Registred to the following hash:', name);
});
```

#### IPNS - Resolve

```Javascript
EmbarkJS.Storage.resolve('IPNS_hash', (err, path) => {
    if(err){
        console.log("Error resolving", err.message);
        return;
    }
    console.log('Resolved to the following IPFS path:', name);
});
```


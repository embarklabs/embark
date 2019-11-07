title: Configuring decentralized storages
layout: docs
---

With Embark, we easily connect to decentralized storage solutions such as IPFS and Swarm. This enables us to upload, storing and download data and assets for our decentralized applications. Let's take a closer look at how to make use of this.

## Configuration basics

Embark will check our preferred storage configuration in the file `config/storage.js`, unless [configured differently](/docs/configuration.html) in our application's `embark.json` file. This file contains the preferred configuration for each environment, with `default` being the configuration that applies to every environment. If [environments in Embark](/docs/environments.html) are new to you, check out the dedicated guide first and come back.

Each of these configuration options can be individually overridden on a per environment basis.

```
module.exports = {
  "default": {
    "enabled": true,
    "ipfs_bin": "ipfs",
    "available_providers": ["ipfs", "swarm"],
    "upload":{
      "provider": "ipfs",
      "host": "localhost",
      "port": 5001,
      "getUrl": "http://localhost:8080/ipfs"
    },
    "dappConnection":[
      {"provider": "swarm", "host": "localhost", "port": 8500, "getUrl": "http://localhost:8500/bzz:/"},
      {"provider": "ipfs", "host": "localhost", "port": 5001, "getUrl": "http://localhost:8080/ipfs/"}
    ]
  },
  "development": {
    "enabled": true,
    "provider": "ipfs",
    "host": "localhost",
    "port": 5001
  }
}
```

The available options are:

Option | Type: `default` | Value
--- | --- | ---
`enabled`    | boolean: `true` | Enables or completely disables storage support
`ipfs_bin`    | string: `ipfs` | Name or desired path to the ipfs binary
`available_providers`    | array: `["ipfs", "swarm"]` | List of storages to be supported on the dapp. This will affect what's available with the EmbarkJS library on the dapp.
`upload`      | | The upload element specifies storage provider settings used for uploading your dapp. A swarm node will be automatically launched in a child process using these settings.
`upload.provider`    | string: `ipfs` | Desired provider to use when uploading dapp.
`upload.protocol`    | string: `http` | Storage provider protocol for upload, ie `http` or `https`
`upload.host`        | string: `localhost` | Host value used to interact with the storage provider for upload, i.e. `localhost` or `swarm-gateways.net`
`upload.port`        | integer: `5001` | Port value used to interact with the storage provider for upload, i.e. `5001` (IPFS local node) or `8500` (Swarm local node) or `80`
`upload.getUrl`      | string: `http://localhost:8080/ipfs/` | Only for IPFS. This sets the file/document retrieval URL, which is different than the host/port combination used to interact with the IPFS API.
`dappConnection`     | | List of storage providers to attempt connection to in the dapp. Each provider process will be launched in a child process. Each connection listed will be tried in order on the dapp, until one is avaialable. Can also specify `$BZZ` to attempt to connect to an injected swarm object.
`dappConnection.provider` | string: `ipfs` | Desired provider to use for dapp storage.
`dappConnection.protocol`    | string: `http` | Storage provider protocol used in the dapp, i.e. `http` or `https`
`dappConnection.host`        | string | Host value used to interact with the storage provider in the dapp, i.e. `localhost` or `swarm-gateways.net`
`dappConnection.port`        | integer | Port value used to interact with the storage provider in the dapp, i.e. `5001` (IPFS local node) or `8500` (Swarm local node) or `80`. Can specify `false` if a port should not be included in the connection URL (i.e. for a public gateway like `http://swarm-gateways.net`).
`dappConnection.getUrl`      | string | Only for IPFS. This sets the file/document retrieval URL, which is different than the host/port combination used to interact with the IPFS API.

## Using a local node

Either for IPFS or Swarm, Embark will default to use a local node for development purposes. Note that we still need to set up the right port according to the storage platform we use. By default, IPFS runs on port `5001` and Swarm runs on `8500`.

We can start a local storage node ourselves or now we can let Embark start the node for us. Letting Embark do the job lets us focus on developing faster while doing it ourselves might give us more flexibility. Obviously, we still need to have IPFS or Swarm installed locally for it to work.

**Important configurations for swarm**:

```
{
  "development": {
    "provider": "swarm",
    "account": {
      "address": "YOUR_ACCOUNT_ADDRESS",
      "password": "PATH/TO/PASSWORD/FILE"
    },
    "swarmPath": "PATH/TO/SWARM/EXECUTABLE"
  }
}
```

## Using a public gateway

Embark can connect to a public gateway when using any of the available storage options. To use a public gateway, instead of running a local node, for IPFS or Swarm, use the following `config/storage.js` options:

### IPFS
```
"development": {
  "enabled": true,
  "upload":{
    "provider": "ipfs",
    "host": "ipfs.infura.io",
    "port": 80,
    "protocol": "https",
    "getUrl": "https://ipfs.infura.io/ipfs/"
  }
}
```

### Swarm

```
"development": {
  "enabled": true,
  "upload": {
    "provider": "swarm",
    "host": "localhost",
    "port": 8500
  }
}
```

## Troubleshooting

If you are running your own processes for IPFS or Swarm, the CORS needs to be set to the domain of your application, to the geth domain, and to the domain of the storage used inside the application.

If you are using the built in webserver, the CORS would need to be set to `http://localhost:8000`, however if you are using `embark upload`, the domain of the decentralised storage host should be included in CORS.

Depending on your `upload` settings in `storage.js`, this could be `http://localhost:8080` or `http://ipfs.infura.io` for IPFS or it could be `http://localhost:8500` or `http://swarm-gateways.net` for Swarm.

Of course, if you are hosting your DApp on a different domain (i.e. not `localhost`, then that would need to be included in CORS as well. Examples of how to include multiple domains for each are below:

```
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"http://localhost:8000\", \"http://localhost:8500\", \"http://localhost:8545\", \"ws://localhost:8546\"]"
```
NOTE: `http://localhost:8545` and `ws://localhost:8546` are for geth.

```
swarm --bzzaccount=fedda09fd9218d1ea4fd41ad44694fa4ccba1878 --datadir=~/.bzz-data/ --password=config/development/password --corsdomain=http://localhost:8000,http://localhost:8080,http://localhost:8545,ws://localhost:8546 --ens-api=''
```

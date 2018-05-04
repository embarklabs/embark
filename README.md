![Embark](https://github.com/iurimatias/embark-framework/raw/develop/logo.png)

[![npm](https://img.shields.io/npm/dm/embark.svg)](https://npmjs.com/package/embark)
[![Gitter](https://img.shields.io/gitter/room/embark-framework/Lobby.svg)](https://gitter.im/embark-framework/Lobby)
[![Build Status](https://travis-ci.org/embark-framework/embark.svg?branch=develop)](https://travis-ci.org/embark-framework/embark)
[![Build status](https://ci.appveyor.com/api/projects/status/nnq38x2hi3q11o44/branch/develop?svg=true)](https://ci.appveyor.com/project/iurimatias/embark/branch/develop)

What is Embark
======

Embark is a framework that allows you to easily develop and deploy Decentralized Applications (DApps).

A Decentralized Application is a serverless html5 application that uses one or more decentralized technologies.

Embark currently integrates with EVM blockchains (Ethereum), Decentralized Storages (IPFS), and Decentralized communication platforms (Whisper and Orbit). Swarm is supported for deployment.

With Embark you can:

**Blockchain (Ethereum)**
* Automatically deploy contracts and make them available in your JS code. Embark watches for changes, and if you update a contract, Embark will automatically redeploy the contracts (if needed) and the dapp.
* Contracts are available in JS with Promises.
* Do Test Driven Development with Contracts using Javascript.
* Keep track of deployed contracts; deploy only when truly needed.
* Manage different chains (e.g testnet, private net, livenet)
* Easily manage complex systems of interdependent contracts.

**Decentralized Storage (IPFS)**
* Easily Store & Retrieve Data on the DApp through EmbarkJS. Including uploading and retrieving files.
* Deploy the full application to IPFS or Swarm.


**Decentralized Communication (Whisper, Orbit)**
* Easily send/receive messages through channels in P2P through Whisper or Orbit.

**Web Technologies**
* Integrate with any web technology including React, Foundation, etc..
* Use any build pipeline or tool you wish, including grunt, gulp and webpack.

```Bash
$ npm -g install embark

# If you plan to use the simulator instead of a real ethereum node.
$ npm -g install ethereumjs-testrpc
```

See [Complete Documentation](https://embark.status.im/docs/).


![Embark](https://github.com/embarklabs/embark/raw/master/header.jpg)

[![npm](https://img.shields.io/npm/dm/embark.svg)](https://npmjs.com/package/embark)
[![Gitter](https://img.shields.io/gitter/room/embark-framework/Lobby.svg)](https://gitter.im/embark-framework/Lobby)
[![Build Status](https://dev.azure.com/embark-framework/Embark/_apis/build/status/embarklabs.embark?branchName=master)](https://dev.azure.com/embark-framework/Embark/_build/latest?definitionId=2&branchName=master)
![Open PRs](https://img.shields.io/github/issues-pr-raw/embarklabs/embark.svg)
![Closed PRs](https://img.shields.io/github/issues-pr-closed-raw/embarklabs/embark.svg)
![GitHub commit activity the past week, 4 weeks, year](https://img.shields.io/github/commit-activity/y/embarklabs/embark.svg)
[![Coverage Status](https://coveralls.io/repos/github/embarklabs/embark/badge.svg)](https://coveralls.io/github/embarklabs/embark)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=embarklabs/embark)](https://dependabot.com)

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

**Decentralized Storage (IPFS, Swarm)**
* Easily Store & Retrieve Data on the DApp through EmbarkJS. Including uploading and retrieving files.
* Deploy the full application to IPFS or Swarm.
* Import and deploy contracts hosted on Swarm.


**Decentralized Communication (Whisper, Orbit)**
* Easily send/receive messages through channels in P2P through Whisper or Orbit.

**Web Technologies**
* Integrate with any web technology including React, Foundation, etc..
* Use any build pipeline or tool you wish, including grunt, gulp and webpack.

```Bash
$ npm -g install embark
```

See [Complete Documentation](https://framework.embarklabs.io/docs/).

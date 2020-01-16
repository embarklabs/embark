title: Installation
layout: docs
---
In this guide we'll cover all the different ways of installing Embark on your local machine, starting with prerequisites.

## Prerequisites

In order to make Embark work on our computer, we need to have some tools installed first. Make sure you have the following ready and in the correct version:

- [Node](#Node)
- [Ethereum Client](#Ethereum-Client-Optional)
- [IPFS](#IPFS-Optional)

Once done, go ahead and [install Embark](#Installing-Embark).

### Node

Please install [Node.js](http://nodejs.org/) in version 10.17.0.

{% notification info 'Quick Tip' %}
We recommend installing Node using the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.md).  This is because it makes it very easy to install different versions of Node in isolated environments that don't require users to [change their permissions](https://docs.npmjs.com/getting-started/fixing-npm-permissions) when installing packages. Find instructions on how to install NVM [here](https://github.com/creationix/nvm/blob/master/README.md#install-script).
{% endnotification %}

### IPFS (Optional)

IPFS can be used to distribute our application's content on the decentralized IPFS nodes. This can be skipped in case this isn't planned, however we do recommend it. Checkout IPFS' [installation guide](https://docs.ipfs.io/guides/guides/install/) to learn how to install IPFS on our local machine.

To verify that the installation was successful, simply run the following command:

```
$ ipfs --version
```

This outputs something like

```
$ ipfs version 0.4.17
```

### Ethereum Client (Optional)

Embark can spin up an Ethereum node for us. To make this happen, an Ethereum client has to be installed on our machine as well. Embark already comes with [Ganache CLI](https://truffleframework.com/ganache), a blockchain node emulator, which is accessible via [Embark's simulator](embark_commands.html#simulator) command.

In case we want to run a real node, [geth](https://geth.ethereum.org/) is a pretty good one. Check out the [installation guide](https://ethereum.github.io/go-ethereum/install/) for our platform and verify our installation with:

```
$ geth version
```

Which should result in an output that looks like this (note that the exact version numbers may be different):

```
Geth
Version: 1.8.15-stable
Git Commit: 89451f7c382ad2185987ee369f16416f89c28a7d
Architecture: amd64
Protocol Versions: [63 62]
Network Id: 1
Go Version: go1.10.4
Operating System: darwin
GOPATH=
GOROOT=/Users/travis/.gimme/versions/go1.10.4.darwin.amd64
```

## Installing Embark

Alright, let's install Embark so we can build our first application. As mentioned earlier, if anything is unclear or you run into problems, make sure to reach out to us on our dedicated channels, [submit an issue on  GitHub](https://github.com/embarklabs/embark/issues), or take a look at our [troubleshooting guide](troubleshooting.html).

We can install Embark using the Node Package Manager (no worries, that one comes with Node), like this:

```
$ npm -g install embark
```

After that, `embark` should be available as a global command in our terminal of choice. Let's verify this by running the following command:

```
$ embark --version
```

At the time of writing this guide, the output looked like this:

```
4.0.0
```

Awesome! We're all set up. If you're brand new to Embark, now would be a good time to take our [Quickstart](/docs/quick_start.html) in which you'll build your first application!
